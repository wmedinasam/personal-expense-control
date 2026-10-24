import { formatAt } from "@/lib/audit-view";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PreauthorizeForm, UserButton } from "./UserControls";
import { isAdminEmail } from "@/auth";
import { Card, PageShell } from "@/app/_components/ui";

export const dynamic = "force-dynamic";

const STATUS = {
  PENDING: { label: "Pendiente", cls: "bg-accent/15 text-accent" },
  ACTIVE: { label: "Activo", cls: "bg-success/15 text-success" },
  DISABLED: { label: "Desactivado", cls: "bg-surface-2 text-muted" },
} as const;
const STATUS_ORDER = { PENDING: 0, ACTIVE: 1, DISABLED: 2 } as const;

const fmt = (d: Date | null) => (d ? formatAt(d) : "Nunca");

export default async function UsuariosPage() {
  // Igual que requireAdmin(), pero a un no-admin le responde 404 en vez de lanzar un error.
  const me = await requireUser();
  if (me.role !== "ADMIN") notFound();

  const users = (await prisma.user.findMany({ orderBy: { createdAt: "asc" } })).sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  );
  const pending = users.filter((u) => u.status === "PENDING").length;

  return (
    <PageShell title="Usuarios">
      <p className="text-sm text-muted">
        Aprueba cuentas nuevas, cambia roles y pre-autoriza correos de la familia.
      </p>

      {pending > 0 && (
        <p role="status" className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-medium text-foreground">
          {pending === 1 ? "1 usuario espera" : `${pending} usuarios esperan`} aprobación.
        </p>
      )}

      <Card>
        <h2 className="mb-4 text-base font-semibold text-foreground">Pre-autorizar un correo</h2>
        <PreauthorizeForm />
      </Card>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">Listado</h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface px-4">
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  {u.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.image} alt="" className="size-10 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold uppercase text-foreground">
                      {(u.name ?? u.email)[0]}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {u.name ?? "Sin nombre"}
                      {u.id === me.id && <span className="ml-1 text-muted">(tú)</span>}
                    </p>
                    <p className="truncate text-xs text-muted">{u.email}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className={`rounded px-1.5 py-0.5 font-medium ${STATUS[u.status].cls}`}>{STATUS[u.status].label}</span>
                      <span>{u.role === "ADMIN" ? "Administrador" : "Miembro"}</span>
                      <span>· Último acceso: {fmt(u.lastLoginAt)}</span>
                      <span>· Alta: {fmt(u.createdAt)}</span>
                    </p>
                  </div>
                </div>

                {u.id !== me.id && !isAdminEmail(u.email) && (
                  <div className="flex flex-wrap items-start gap-2">
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
    </PageShell>
  );
}
