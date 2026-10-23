// Funciones puras del visor de auditoría (/auditoria). Sin imports de runtime: las prueba scripts/check-audit-view.mjs.

export const ACTION_LABELS: Record<string, string> = {
  CREATE: "Creó",
  UPDATE: "Modificó",
  DELETE: "Borró",
  LOGIN: "Ingresó",
  LOGIN_DENIED: "Ingreso rechazado",
};

export const ENTITY_LABELS: Record<string, string> = {
  Category: "Categoría",
  Expense: "Gasto",
  Budget: "Presupuesto",
  Setting: "Configuración",
  User: "Usuario",
};

export type Change = { field: string; before: unknown; after: unknown };

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * before/after → lista de cambios.
 * Con los dos (UPDATE) devuelve solo los campos distintos; con uno solo (CREATE/DELETE), todos sus campos.
 */
export function diffAudit(before: unknown, after: unknown): Change[] {
  const b = isObject(before) ? before : {};
  const a = isObject(after) ? after : {};
  const both = isObject(before) && isObject(after);
  const fields = [...new Set([...Object.keys(b), ...Object.keys(a)])];
  return fields
    .filter((f) => !both || JSON.stringify(b[f]) !== JSON.stringify(a[f]))
    .map((field) => ({ field, before: b[field], after: a[field] }));
}

/** Valor del JSON como texto plano para mostrar ("—" si no hay). */
export function formatValue(v: unknown): string {
  if (v === undefined || v === null) return "—";
  return typeof v === "string" ? v : JSON.stringify(v);
}

/** Resumen corto del registro: nombre, monto o correo, según lo que tenga. */
export function summarize(before: unknown, after: unknown, userEmail?: string | null): string {
  const r = isObject(after) ? after : isObject(before) ? before : {};
  const parts: string[] = [];
  if (typeof r.name === "string") parts.push(r.name);
  if (r.amount !== undefined && r.amount !== null) parts.push(`${r.amount} ${r.currency ?? ""}`.trim());
  if (typeof r.description === "string" && r.description) parts.push(r.description);
  if (!parts.length && r.usdToGtq !== undefined) parts.push(`${r.defaultCurrency ?? ""} · USD→GTQ ${r.usdToGtq}`);
  if (!parts.length && typeof r.email === "string") parts.push(r.email);
  if (!parts.length && userEmail) parts.push(userEmail);
  return parts.join(" · ") || "—";
}

// shortcut: Guatemala es UTC-6 fijo (sin horario de verano); cambiar si se usa otra zona.
const GT_OFFSET_HOURS = 6;

/**
 * "dd/mm/aaaa" → instante UTC del inicio de ese día en Guatemala, o null si es inválida.
 * Con endOfDay, el inicio del día siguiente (para filtrar con lt).
 */
export function parseDmy(text: string, endOfDay = false): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const check = new Date(Date.UTC(y, mo - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
  return new Date(Date.UTC(y, mo - 1, d + (endOfDay ? 1 : 0), GT_OFFSET_HOURS));
}

const AT_FORMAT = new Intl.DateTimeFormat("es-GT", {
  timeZone: "America/Guatemala",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "23/10/2026 14:05" en hora de Guatemala. */
export const formatAt = (d: Date) => AT_FORMAT.format(d).replace(", ", " ");
