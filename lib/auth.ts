import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// Usuario de la sesión leído de la BD en cada request: así un cambio de estado o rol aplica al instante.
export const getCurrentUser = cache(async () => {
  const id = (await auth())?.user?.id;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
});

/** Exige un usuario activo. Úsalo al inicio de cada server action. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status !== "ACTIVE") redirect("/"); // el layout muestra "pendiente de aprobación"
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Solo un administrador puede hacer esto.");
  return user;
}
