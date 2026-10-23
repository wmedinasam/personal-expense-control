import { prisma } from "@/lib/db";
import {
  CATEGORY_ICON_NAMES,
  HEX_COLOR_RE,
  ICON_MAX_BYTES,
  NAME_MAX_LENGTH,
  type CategoryFields,
  type CategoryListItem,
  type ValidationResult,
} from "@/app/categorias/shared";

export function normalizeCategoryName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export type IconValidation =
  | { ok: true; data: { icon: string | null; iconData: string | null } }
  | { ok: false; error: string };

// data:<mime>;base64,<payload>. Solo los tipos aceptados en la interfaz.
const ICON_DATA_URL_RE =
  /^data:(image\/(?:png|jpeg|svg\+xml|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

const ICON_TYPE_ERROR = "El archivo debe ser una imagen PNG, JPG, SVG o WEBP.";
const ICON_SIZE_ERROR = "El icono no puede superar 100 KB.";

/** Bytes que codifica una cadena base64 (sin contar el relleno «=»). */
export function base64DecodedLength(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length / 4) * 3 - padding;
}

/** Comprueba que los bytes correspondan al tipo MIME declarado. */
function matchesMimeSignature(mime: string, bytes: Buffer): boolean {
  switch (mime) {
    case "image/png":
      return bytes.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    case "image/jpeg":
      return bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    case "image/webp":
      return (
        bytes.subarray(0, 4).toString("latin1") === "RIFF" &&
        bytes.subarray(8, 12).toString("latin1") === "WEBP"
      );
    case "image/svg+xml": {
      const text = bytes.toString("utf8");
      // Un SVG usado como icono no debe ejecutar scripts ni handlers en línea.
      return (
        /<svg[\s>]/i.test(text) &&
        !/<script/i.test(text) &&
        !/\son[a-z]+\s*=/i.test(text) &&
        !/javascript:/i.test(text)
      );
    }
    default:
      return false;
  }
}

/**
 * Valida el icono de una categoría. Función pura (sin base de datos):
 * - `icon`: vacío o un nombre de CATEGORY_ICON_NAMES.
 * - `iconData`: vacío o una data URL PNG/JPG/SVG/WEBP de como máximo 100 KB
 *   cuyo contenido coincide con el tipo declarado.
 * Si ambos vienen informados, el icono personalizado tiene prioridad al mostrarse.
 */
export function validateCategoryIcon(input: {
  icon: string;
  iconData: string;
}): IconValidation {
  const icon = input.icon.trim();
  if (icon && !(CATEGORY_ICON_NAMES as readonly string[]).includes(icon)) {
    return { ok: false, error: "El icono seleccionado no es válido." };
  }

  const iconData = input.iconData.trim();
  if (!iconData) {
    return { ok: true, data: { icon: icon || null, iconData: null } };
  }

  const match = ICON_DATA_URL_RE.exec(iconData);
  if (!match || match[2].length % 4 !== 0) {
    return { ok: false, error: ICON_TYPE_ERROR };
  }

  const [, mime, base64] = match;
  if (base64DecodedLength(base64) > ICON_MAX_BYTES) {
    return { ok: false, error: ICON_SIZE_ERROR };
  }

  if (!matchesMimeSignature(mime, Buffer.from(base64, "base64"))) {
    return { ok: false, error: ICON_TYPE_ERROR };
  }

  return { ok: true, data: { icon: icon || null, iconData } };
}

/**
 * Valida nombre y color. Comprueba unicidad sin distinguir mayúsculas.
 * `excludeId` evita que una categoría entre en conflicto consigo misma al editarla.
 */
export async function validateCategoryFields(
  input: CategoryFields,
  excludeId?: string,
): Promise<ValidationResult> {
  const name = normalizeCategoryName(input.name);
  if (name.length === 0) {
    return { ok: false, error: "El nombre no puede estar vacío." };
  }
  if (name.length > NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `El nombre no puede tener más de ${NAME_MAX_LENGTH} caracteres.`,
    };
  }

  const color = input.color.trim();
  if (!HEX_COLOR_RE.test(color)) {
    return { ok: false, error: "El color seleccionado no es válido." };
  }

  const iconResult = validateCategoryIcon({
    icon: input.icon,
    iconData: input.iconData,
  });
  if (!iconResult.ok) return iconResult;

  const conflict = await prisma.category.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (conflict) {
    return { ok: false, error: `Ya existe una categoría llamada «${name}».` };
  }

  return {
    ok: true,
    data: { name, color, ...iconResult.data },
  };
}

export async function listCategoriesWithUsage(): Promise<CategoryListItem[]> {
  const rows = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
      iconData: true,
      _count: { select: { expenses: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    icon: r.icon,
    iconData: r.iconData,
    expenseCount: r._count.expenses,
  }));
}

export function countCategoryExpenses(categoryId: string): Promise<number> {
  return prisma.expense.count({ where: { categoryId } });
}
