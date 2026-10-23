"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type UserStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { isAdminEmail } from "@/auth";
import { normalizeEmail, userChangeError, type UserChange } from "@/lib/users";
import type { ActionResult } from "@/app/categorias/shared";

// Operación → cambio y estado(s) desde el que se permite.
const OPS: Record<string, { change: UserChange; from?: UserStatus[]; done: string }> = {
  approve: { change: { status: "ACTIVE" }, from: ["PENDING"], done: "aprobado" },
  disable: { change: { status: "DISABLED" }, from: ["PENDING", "ACTIVE"], done: "desactivado" },
  enable: { change: { status: "ACTIVE" }, from: ["DISABLED"], done: "reactivado" },
  makeAdmin: { change: { role: "ADMIN" }, done: "ahora es administrador" },
  makeMember: { change: { role: "MEMBER" }, done: "ahora es miembro" },
};

class RuleError extends Error {}

export async function changeUser(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const op = OPS[String(formData.get("op") ?? "")];
  if (!id || !op) return { ok: false, error: "Solicitud inválida." };

  try {
    const after = await prisma.$transaction(
      async (tx) => {
        const before = await tx.user.findUnique({ where: { id } });
        if (!before) throw new RuleError("El usuario ya no existe.");
        if (op.from && !op.from.includes(before.status)) throw new RuleError("El usuario cambió de estado; recarga la página.");
        const error = userChangeError({
          actorId: admin.id,
          target: before,
          change: op.change,
          targetIsAdminEmail: isAdminEmail(before.email),
          activeAdminCount: await tx.user.count({ where: { role: "ADMIN", status: "ACTIVE" } }),
        });
        if (error) throw new RuleError(error);

        const after = await tx.user.update({ where: { id }, data: op.change });
        await audit(tx, { userId: admin.id, userEmail: admin.email, action: "UPDATE", entity: "User", entityId: id, before, after });
        return after;
      },
      // Serializable: dos admins degradándose a la vez no pueden dejar el sistema sin admin activo.
      { isolationLevel: "Serializable" },
    );
    revalidatePath("/", "layout");
    return { ok: true, message: `${after.name ?? after.email} ${op.done}.` };
  } catch (e) {
    if (e instanceof RuleError) return { ok: false, error: e.message };
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034") {
      return { ok: false, error: "Otro cambio se hizo al mismo tiempo. Inténtalo de nuevo." };
    }
    console.error("[usuarios] changeUser", e);
    return { ok: false, error: "No se pudo completar la operación. Inténtalo de nuevo." };
  }
}

/** Crea un usuario ACTIVE con ese correo; al entrar con Google se enlaza a él (ver auth.config.ts). */
export async function preauthorizeUser(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email) return { ok: false, error: "Escribe un correo válido." };
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "MEMBER";

  const duplicate = { ok: false as const, error: `Ya existe un usuario con el correo ${email}.` };
  // Sin distinguir mayúsculas; la carrera la cubre el @unique (P2002).
  if (await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } })) {
    return duplicate;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const after = await tx.user.create({ data: { email, role, status: "ACTIVE" } });
      await audit(tx, { userId: admin.id, userEmail: admin.email, action: "CREATE", entity: "User", entityId: after.id, after });
    });
    revalidatePath("/usuarios");
    return { ok: true, message: `${email} pre-autorizado como ${role === "ADMIN" ? "administrador" : "miembro"}.` };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return duplicate;
    }
    console.error("[usuarios] preauthorizeUser", e);
    return { ok: false, error: "No se pudo completar la operación. Inténtalo de nuevo." };
  }
}
