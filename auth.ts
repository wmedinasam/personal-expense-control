import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { authConfig } from "./auth.config";

export function isAdminEmail(email: string | null | undefined): boolean {
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(admin && email && email.trim().toLowerCase() === admin);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    // Solo correos que Google ya verificó.
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.email_verified === true) return true;
      await audit(prisma, {
        userId: null,
        userEmail: profile?.email ?? null,
        action: "LOGIN_DENIED",
        entity: "User",
        after: { provider: account?.provider, reason: "correo no verificado" },
      });
      return false;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  events: {
    // Corre después de crear la cuenta en el primer ingreso. ADMIN_EMAIL siempre queda como admin activo.
    async signIn({ user }) {
      if (!user.id) return;
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          ...(isAdminEmail(user.email) ? { role: "ADMIN", status: "ACTIVE" } : {}),
        },
      });
      await audit(prisma, {
        userId: updated.id,
        userEmail: updated.email,
        action: "LOGIN",
        entity: "User",
        entityId: updated.id,
        after: { status: updated.status, role: updated.role },
      });
    },
  },
});
