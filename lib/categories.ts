import { prisma } from "@/lib/db";
import { WHO_INCLUDE } from "@/lib/audit";
import {
  HEX_COLOR_RE,
  NAME_MAX_LENGTH,
  parseCategoryIcon,
  type CategoryFields,
  type CategoryListItem,
  type ValidationResult,
} from "@/app/categorias/shared";

export function normalizeCategoryName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/**
 * Valida nombre, color e ícono. Comprueba unicidad sin distinguir mayúsculas.
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

  const icon = parseCategoryIcon(input.icon);
  if (!icon.ok) return { ok: false, error: icon.error };

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

  return { ok: true, data: { name, color, icon: icon.icon } };
}

export async function listCategoriesWithUsage(): Promise<CategoryListItem[]> {
  const rows = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
      _count: { select: { expenses: true } },
      createdAt: true,
      updatedAt: true,
      ...WHO_INCLUDE,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    icon: r.icon,
    expenseCount: r._count.expenses,
    createdAt: r.createdAt,
    createdBy: r.createdBy,
    updatedAt: r.updatedAt,
    updatedBy: r.updatedBy,
  }));
}

export function countCategoryExpenses(categoryId: string): Promise<number> {
  return prisma.expense.count({ where: { categoryId } });
}
