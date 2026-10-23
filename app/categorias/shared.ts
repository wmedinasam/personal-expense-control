// Constantes y tipos compartidos entre componentes cliente y servidor.
// No importar Prisma aquí: este archivo se incluye en el bundle del cliente.

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

export type CategoryFields = {
  name: string;
  color: string;
  /** Nombre de icono predefinido, o cadena vacía para ninguno. */
  icon: string;
  /** Data URL de icono personalizado, o cadena vacía para ninguno. */
  iconData: string;
};

/** Valores ya validados y normalizados, listos para guardar en la base de datos. */
export type CategoryValues = {
  name: string;
  color: string;
  icon: string | null;
  iconData: string | null;
};

export type ValidationResult =
  | { ok: true; data: CategoryValues }
  | { ok: false; error: string };

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export type CategoryListItem = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  iconData: string | null;
  expenseCount: number;
};

// Iconos predefinidos (nombres de lucide-react). Se guardan en `Category.icon`.
// El mapa nombre → componente vive en `icons.tsx` para no subir todo lucide aquí.
export const CATEGORY_ICON_NAMES = [
  "ShoppingCart",
  "Utensils",
  "Car",
  "Home",
  "Zap",
  "Heart",
  "Plane",
  "Gift",
  "Book",
  "Coffee",
  "Shirt",
  "Fuel",
  "Phone",
  "Film",
  "Wallet",
  "Stethoscope",
  "GraduationCap",
  "Dumbbell",
  "Dog",
  "Wrench",
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_NAMES)[number];

// Icono subido por el usuario: PNG, JPG, SVG o WEBP, máximo 100 KB (tamaño del archivo).
export const ICON_MAX_BYTES = 100 * 1024;
export const ICON_ACCEPTED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
] as const;
export const ICON_ACCEPT_ATTR = ICON_ACCEPTED_MIME_TYPES.join(",");
