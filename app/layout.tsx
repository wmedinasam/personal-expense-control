import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { signOut } from "@/auth";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finanzas personales",
  description: "Control de gastos y presupuestos",
};

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/gastos", label: "Gastos" },
  { href: "/presupuestos", label: "Presupuestos" },
  { href: "/categorias", label: "Categorías" },
  { href: "/configuracion", label: "Configuración" },
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const isAdmin = user?.status === "ACTIVE" && user.role === "ADMIN";
  const pendingUsers = isAdmin ? await prisma.user.count({ where: { status: "PENDING" } }) : 0;
  const links = isAdmin
    ? [
        ...LINKS,
        { href: "/usuarios", label: pendingUsers ? `Usuarios (${pendingUsers})` : "Usuarios" },
        { href: "/auditoria", label: "Auditoría" },
      ]
    : LINKS;

  const logout = (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button type="submit" className="text-neutral-400 hover:text-white hover:underline">
        Salir
      </button>
    </form>
  );

  let content: React.ReactNode = children; // sin sesión solo se llega a /login (middleware)
  if (user && user.status !== "ACTIVE") {
    content = (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm space-y-4 rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center">
          <h1 className="text-lg font-semibold text-neutral-100">
            {user.status === "PENDING" ? "Cuenta pendiente de aprobación" : "Cuenta desactivada"}
          </h1>
          <p className="text-sm text-neutral-400">
            {user.status === "PENDING"
              ? `Tu cuenta (${user.email}) ya está creada. Un administrador debe aprobarla para que puedas entrar.`
              : "Un administrador desactivó tu cuenta. Pídele que la vuelva a activar."}
          </p>
          <div className="flex justify-center text-sm">{logout}</div>
        </div>
      </main>
    );
  } else if (user) {
    content = (
      <>
        <nav className="border-b border-neutral-800 bg-neutral-950">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-3 text-sm">
            <ul className="flex flex-wrap gap-4">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-neutral-300 hover:text-white hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-3">
              {user.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="size-6 rounded-full" referrerPolicy="no-referrer" />
              )}
              <span className="text-neutral-300">{user.name ?? user.email}</span>
              {logout}
            </div>
          </div>
        </nav>
        {children}
      </>
    );
  }

  return (
    <html lang="es" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {content}
      </body>
    </html>
  );
}
