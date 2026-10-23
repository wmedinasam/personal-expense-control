// Reglas puras de administración de usuarios (sin Prisma: las prueba scripts/check-users.mjs).
import type { Role, UserStatus } from "@prisma/client";

export type UserChange = { role?: Role; status?: UserStatus };

type RuleInput = {
  actorId: string;
  target: { id: string; role: Role; status: UserStatus };
  change: UserChange;
  /** El objetivo es el correo de ADMIN_EMAIL. */
  targetIsAdminEmail: boolean;
  /** ADMIN ACTIVE que hay hoy, contando al objetivo si lo es. */
  activeAdminCount: number;
};

/** Devuelve el motivo por el que el cambio no se permite, o null si se puede hacer. */
export function userChangeError({ actorId, target, change, targetIsAdminEmail, activeAdminCount }: RuleInput): string | null {
  const role = change.role ?? target.role;
  const status = change.status ?? target.status;
  const losesAdmin = role !== "ADMIN" || status !== "ACTIVE";

  if (target.id === actorId && losesAdmin) {
    return "No puedes quitarte el rol de administrador ni desactivarte a ti mismo.";
  }
  if (targetIsAdminEmail && losesAdmin) {
    return "El administrador principal (ADMIN_EMAIL) no se puede degradar ni desactivar.";
  }
  const wasActiveAdmin = target.role === "ADMIN" && target.status === "ACTIVE";
  if (wasActiveAdmin && losesAdmin && activeAdminCount <= 1) {
    return "Debe quedar al menos un administrador activo.";
  }
  return null;
}

// Formato práctico, no RFC completo; Google valida el resto al entrar.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Normaliza un correo (minúsculas, sin espacios) o devuelve null si no es válido. */
export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : null;
}
