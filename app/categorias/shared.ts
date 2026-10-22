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

export type CategoryFields = { name: string; color: string };

export type ValidationResult =
  | { ok: true; data: CategoryFields }
  | { ok: false; error: string };

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export type CategoryListItem = {
  id: string;
  name: string;
  color: string;
  expenseCount: number;
};
