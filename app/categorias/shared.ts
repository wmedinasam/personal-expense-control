// Constantes y tipos compartidos entre componentes cliente y servidor.
// No importar Prisma aquí: este archivo se incluye en el bundle del cliente.
import type { AuditStampData } from "@/lib/audit";

export const NAME_MAX_LENGTH = 40;
export const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
export const DEFAULT_CATEGORY_COLOR = "#64748b";

export const CATEGORY_COLORS = [
  { hex: "#64748b", label: "Gris" },
  { hex: "#ef4444", label: "Rojo" },
  { hex: "#f97316", label: "Naranja" },
  { hex: "#eab308", label: "Amarillo" },
  { hex: "#22c55e", label: "Verde" },
  { hex: "#14b8a6", label: "Turquesa" },
  { hex: "#3b82f6", label: "Azul" },
  { hex: "#8b5cf6", label: "Violeta" },
  { hex: "#ec4899", label: "Rosa" },
  { hex: "#78716c", label: "Marrón" },
] as const;

// Íconos predefinidos (lucide-react). Se guardan como "lucide:<name>".
export const LUCIDE_PREFIX = "lucide:";
export const CATEGORY_ICONS = [
  { name: "Utensils", label: "Comida" },
  { name: "ShoppingCart", label: "Supermercado" },
  { name: "Coffee", label: "Café" },
  { name: "Car", label: "Transporte" },
  { name: "Bus", label: "Transporte público" },
  { name: "Fuel", label: "Combustible" },
  { name: "House", label: "Casa" },
  { name: "Zap", label: "Servicios" },
  { name: "Wifi", label: "Internet" },
  { name: "Smartphone", label: "Teléfono" },
  { name: "HeartPulse", label: "Salud" },
  { name: "Pill", label: "Medicinas" },
  { name: "GraduationCap", label: "Educación" },
  { name: "Gamepad2", label: "Ocio" },
  { name: "Film", label: "Entretenimiento" },
  { name: "Shirt", label: "Ropa" },
  { name: "CreditCard", label: "Deudas" },
  { name: "Landmark", label: "Banco e impuestos" },
  { name: "PiggyBank", label: "Ahorro" },
  { name: "Gift", label: "Regalos" },
  { name: "PawPrint", label: "Mascotas" },
  { name: "Baby", label: "Hijos" },
  { name: "Dumbbell", label: "Deporte" },
  { name: "Plane", label: "Viajes" },
] as const;
export type CategoryIconName = (typeof CATEGORY_ICONS)[number]["name"];

// Ícono personalizado: imagen subida, guardada como data URL.
export const ICON_MAX_BYTES = 100 * 1024;
export const ICON_ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";
const DATA_URL_RE = /^data:(image\/(?:png|jpeg|webp|svg\+xml));base64,([A-Za-z0-9+/]+={0,2})$/;

export type IconResult = { ok: true; icon: string | null } | { ok: false; error: string };

/**
 * Valida el valor del campo `icon`: vacío, "lucide:<name>" de la lista, o data URL
 * de imagen PNG/JPG/WEBP/SVG de hasta 100 KB cuyo contenido coincide con su tipo.
 * Se usa en el cliente (aviso inmediato) y en el servidor (validación real).
 */
export function parseCategoryIcon(raw: string): IconResult {
  const value = raw.trim();
  if (value === "") return { ok: true, icon: null };

  if (value.startsWith(LUCIDE_PREFIX)) {
    const name = value.slice(LUCIDE_PREFIX.length);
    return CATEGORY_ICONS.some((i) => i.name === name)
      ? { ok: true, icon: value }
      : { ok: false, error: "El ícono seleccionado no es válido." };
  }

  const tooBig = { ok: false, error: "La imagen no puede pesar más de 100 KB." } as const;
  // Corte barato antes de decodificar: base64 ocupa 4/3 del tamaño real.
  if (value.length > 64 + Math.ceil(ICON_MAX_BYTES / 3) * 4) return tooBig;

  const match = DATA_URL_RE.exec(value);
  if (!match) return { ok: false, error: "La imagen debe ser PNG, JPG, WEBP o SVG." };
  const [, mime, base64] = match;

  let bytes: string;
  try {
    bytes = atob(base64);
  } catch {
    return { ok: false, error: "La imagen está dañada." };
  }
  if (bytes.length > ICON_MAX_BYTES) return tooBig;

  // El tipo declarado no basta: se comprueba la firma del contenido.
  const matchesType =
    (mime === "image/png" && bytes.startsWith("\x89PNG\r\n\x1a\n")) ||
    (mime === "image/jpeg" && bytes.startsWith("\xff\xd8\xff")) ||
    (mime === "image/webp" && bytes.startsWith("RIFF") && bytes.slice(8, 12) === "WEBP") ||
    (mime === "image/svg+xml" && /<svg[\s>]/i.test(bytes));
  if (!matchesType) return { ok: false, error: "El contenido del archivo no coincide con su tipo." };

  return { ok: true, icon: value };
}

export type CategoryFields = { name: string; color: string; icon: string };

export type ValidationResult =
  | { ok: true; data: { name: string; color: string; icon: string | null } }
  | { ok: false; error: string };

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export type CategoryListItem = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  expenseCount: number;
} & AuditStampData;
