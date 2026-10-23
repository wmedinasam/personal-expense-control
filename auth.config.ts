import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Parte de la configuración que puede correr en el middleware (sin Prisma).
export const authConfig = {
  providers: [
    // Enlaza Google al User que ya existe con ese correo (usuarios pre-autorizados en /usuarios);
    // sin esto Auth.js responde OAuthAccountNotLinked. Seguro porque Google verifica el correo y el
    // callback signIn de auth.ts rechaza email_verified !== true.
    Google({ allowDangerousEmailAccountLinking: true }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }) {
      if (request.nextUrl.pathname.startsWith("/login")) return true;
      return Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;
