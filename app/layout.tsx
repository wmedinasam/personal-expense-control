import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="border-b border-neutral-800 bg-neutral-950">
          <ul className="mx-auto flex max-w-5xl flex-wrap gap-4 px-6 py-3 text-sm">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-neutral-300 hover:text-white hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {children}
      </body>
    </html>
  );
}
