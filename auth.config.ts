import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Parte de la configuración que puede correr en el middleware (sin Prisma).
export const authConfig = {
  providers: [Google],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }) {
      if (request.nextUrl.pathname.startsWith("/login")) return true;
      return Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;
