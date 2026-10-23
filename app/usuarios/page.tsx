import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PreauthorizeForm, UserButton } from "./UserControls";

export const dynamic = "force-dynamic";

const STATUS = {
  PENDING: { label: "Pendiente", cls: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300" },
  ACTIVE: { label: "Activo", cls: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300" },
  DISABLED: { label: "Desactivado", cls: "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400" },
} as const;
const STATUS_ORDER = { PENDING: 0, ACTIVE: 1, DISABLED: 2 } as const;

const DATE_TIME = new Intl.DateTimeFormat("es-GT", {
  timeZone: "America/Guatemala",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const fmt = (d: Date | null) => (d ? DATE_TIME.format(d).replace(", ", " ") : "Nunca");

export default async function UsuariosPage() {
  // Igual que requireAdmin(), pero a un no-admin le responde 404 en vez de lanzar un error.
  const me = await requireUser();
  if (me.role !== "ADMIN") notFound();

  const users = (await prisma.user.findMany({ orderBy: { createdAt: "asc" } })).sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  );
  const pending = users.filter((u) => u.status === "PENDING").length;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Aprueba cuentas nuevas, cambia roles y pre-autoriza correos de la familia.
          </p>
        </header>

        {pending > 0 && (
          <p role="status" className="mb-6 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 px-4 py-3 text-sm font-medium text-amber-900 dark:text-amber-200">
            {pending === 1 ? "1 usuario espera" : `${pending} usuarios esperan`} aprobación.
          </p>
        )}

        <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold">Pre-autorizar un correo</h2>
          <PreauthorizeForm />
        </section>

        <section className="mt-8">
          <h2 className="mb-2 text-base font-semibold">Listado</h2>
          <ul className="divide-y divide-slate-200 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-900 px-4 shadow-sm">
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  {u.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.image} alt="" className="size-10 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="flex size-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-sm font-semibold uppercase">
                      {(u.name ?? u.email)[0]}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {u.name ?? "Sin nombre"}
                      {u.id === me.id && <span className="ml-1 text-slate-500 dark:text-slate-400">(tú)</span>}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className={`rounded px-1.5 py-0.5 font-medium ${STATUS[u.status].cls}`}>{STATUS[u.status].label}</span>
                      <span>{u.role === "ADMIN" ? "Administrador" : "Miembro"}</span>
                      <span>· Último acceso: {fmt(u.lastLoginAt)}</span>
                      <span>· Alta: {fmt(u.createdAt)}</span>
                    </p>
                  </div>
                </div>

                {u.id !== me.id && (
                  <div className="flex flex-wrap items-start gap-1">
                    {u.status === "PENDING" && <UserButton id={u.id} op="approve" label="Aprobar" />}
                    {u.status === "DISABLED" ? (
                      <UserButton id={u.id} op="enable" label="Reactivar" />
                    ) : (
                      <UserButton id={u.id} op="disable" label="Desactivar" danger />
                    )}
                    {u.role === "ADMIN" ? (
                      <UserButton id={u.id} op="makeMember" label="Hacer miembro" />
                    ) : (
                      <UserButton id={u.id} op="makeAdmin" label="Hacer admin" />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
