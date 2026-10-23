import type { AuditAction, Prisma } from "@prisma/client";

export type AuditEntity = "Category" | "Expense" | "Budget" | "Setting" | "User";

type AuditInput = {
  userId: string | null;
  userEmail?: string | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
};

// Cliente de Prisma o transacción: lo único que se usa es auditLog.create.
type AuditClient = { auditLog: Pick<Prisma.TransactionClient["auditLog"], "create"> };

/**
 * Pasa un registro a JSON plano para guardarlo en before/after.
 * Decimal y Date quedan como texto; las imágenes subidas (data URL) se resumen para no guardar ~100 KB por cambio.
 */
export function toAuditJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(
    JSON.stringify(value, (_key, v) =>
      typeof v === "string" && v.startsWith("data:") ? `[imagen ${v.slice(5, v.indexOf(";"))}]` : v,
    ),
  );
}

/**
 * Registra un evento de auditoría. Pásale la transacción (tx) del cambio:
 * si el registro falla, el cambio tampoco se guarda.
 *
 *   await prisma.$transaction(async (tx) => {
 *     const after = await tx.expense.create({ data: { ...data, createdById: user.id, updatedById: user.id } });
 *     await audit(tx, { userId: user.id, action: "CREATE", entity: "Expense", entityId: after.id, after });
 *   });
 */
export async function audit(client: AuditClient, input: AuditInput) {
  await client.auditLog.create({
    data: {
      userId: input.userId,
      userEmail: input.userEmail ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      before: toAuditJson(input.before),
      after: toAuditJson(input.after),
    },
  });
}

/** include de Prisma para traer quién creó y quién modificó un registro. */
export const WHO_INCLUDE = {
  createdBy: { select: { name: true, email: true } },
  updatedBy: { select: { name: true, email: true } },
} as const;

type Who = { name: string | null; email: string } | null | undefined;

export type AuditStampData = {
  createdAt?: Date | null;
  createdBy?: Who;
  updatedAt?: Date | null;
  updatedBy?: Who;
};

// shortcut: zona horaria fija de Guatemala; pasar a configuración si la familia usa otra.
const STAMP_FORMAT = new Intl.DateTimeFormat("es-GT", {
  timeZone: "America/Guatemala",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const formatStamp = (d: Date) => STAMP_FORMAT.format(d).replace(", ", " "); // "23/10/2026 14:05"

const whoLabel = (who: Who) => (who ? (who.name ?? who.email) : "—");

/** "Creado por Ana el 23/10/2026 14:05 · Modificado por Luis el 24/10/2026 09:30" */
export function formatAuditStamp(r: AuditStampData): string {
  const parts: string[] = [];
  if (r.createdAt) parts.push(`Creado por ${whoLabel(r.createdBy)} el ${formatStamp(r.createdAt)}`);
  const modified =
    r.updatedAt && (!r.createdAt || r.updatedAt.getTime() - r.createdAt.getTime() > 1000);
  if (modified) parts.push(`Modificado por ${whoLabel(r.updatedBy)} el ${formatStamp(r.updatedAt!)}`);
  return parts.join(" · ");
}
