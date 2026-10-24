import Link from "next/link";
import { notFound } from "next/navigation";
import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ACTION_LABELS, ENTITY_LABELS, diffAudit, formatAt, formatValue, parseDmy, summarize } from "@/lib/audit-view";
import { Button, ButtonLink, EmptyState, Input, Label, PageShell, Select, Table } from "@/app/_components/ui";

export const metadata = { title: "Auditoría" };

const PAGE_SIZE = 50;

type SearchParams = Record<string, string | string[] | undefined>;

const single = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").trim();

export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  // requireAdmin() lanza un error; aquí un no-admin debe ver 404 (sin sesión, requireUser manda a /login).
  const me = await requireUser();
  if (me.role !== "ADMIN") notFound();

  const params = await searchParams;
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { email: "asc" } });

  // Solo valores conocidos; lo demás se ignora.
  const usuario = users.some((u) => u.id === single(params.usuario)) ? single(params.usuario) : "";
  const entidad = Object.hasOwn(ENTITY_LABELS, single(params.entidad)) ? single(params.entidad) : "";
  const accion = Object.hasOwn(ACTION_LABELS, single(params.accion)) ? single(params.accion) : "";
  const desdeText = single(params.desde);
  const hastaText = single(params.hasta);
  const desde = desdeText ? parseDmy(desdeText) : null;
  const hasta = hastaText ? parseDmy(hastaText, true) : null;
  const pagina = Math.max(1, Math.floor(Number(single(params.pagina))) || 1);

  const avisos: string[] = [];
  if (desdeText && !desde) avisos.push(`"Desde" (${desdeText}) no es una fecha válida dd/mm/aaaa; se ignoró.`);
  if (hastaText && !hasta) avisos.push(`"Hasta" (${hastaText}) no es una fecha válida dd/mm/aaaa; se ignoró.`);

  const where: Prisma.AuditLogWhereInput = {
    ...(usuario && { userId: usuario }),
    ...(entidad && { entity: entidad }),
    ...(accion && { action: accion as AuditAction }),
    ...((desde || hasta) && { at: { ...(desde && { gte: desde }), ...(hasta && { lt: hasta }) } }),
  };

  // shortcut: paginación por skip; pasar a cursor si el historial crece a cientos de miles de filas.
  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: [{ at: "desc" }, { id: "desc" }],
    skip: (pagina - 1) * PAGE_SIZE,
    take: PAGE_SIZE + 1,
    include: { user: { select: { name: true, email: true } } },
  });
  const hayMas = rows.length > PAGE_SIZE;
  const eventos = rows.slice(0, PAGE_SIZE);

  // Filtros válidos conservados en la paginación (las fechas inválidas no se arrastran).
  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    if (usuario) q.set("usuario", usuario);
    if (entidad) q.set("entidad", entidad);
    if (accion) q.set("accion", accion);
    if (desde) q.set("desde", desdeText);
    if (hasta) q.set("hasta", hastaText);
    if (p > 1) q.set("pagina", String(p));
    const s = q.toString();
    return s ? `/auditoria?${s}` : "/auditoria";
  };
  const hayFiltros = Boolean(usuario || entidad || accion || desdeText || hastaText);

  return (
    <PageShell title="Auditoría">
      <form method="get" action="/auditoria" className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4">
        <div className="flex min-w-40 flex-1 flex-col gap-1">
          <Label htmlFor="usuario">Usuario</Label>
          <Select id="usuario" name="usuario" defaultValue={usuario}>
            <option value="">Todos</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="entidad">Entidad</Label>
          <Select id="entidad" name="entidad" defaultValue={entidad}>
            <option value="">Todas</option>
            {Object.entries(ENTITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="accion">Acción</Label>
          <Select id="accion" name="accion" defaultValue={accion}>
            <option value="">Todas</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
        <div className="flex w-36 flex-col gap-1">
          <Label htmlFor="desde">Desde</Label>
          <Input id="desde" name="desde" placeholder="dd/mm/aaaa" defaultValue={desdeText} />
        </div>
        <div className="flex w-36 flex-col gap-1">
          <Label htmlFor="hasta">Hasta</Label>
          <Input id="hasta" name="hasta" placeholder="dd/mm/aaaa" defaultValue={hastaText} />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary">
            Aplicar
          </Button>
          {hayFiltros && (
            <ButtonLink href="/auditoria" variant="ghost">
              Limpiar
            </ButtonLink>
          )}
        </div>
      </form>

      {avisos.map((a) => (
        <p key={a} className="text-sm text-danger">{a}</p>
      ))}

      {eventos.length === 0 ? (
        <EmptyState>No hay eventos.</EmptyState>
      ) : (
        <Table>
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Usuario</th>
              <th className="px-3 py-2 font-medium">Acción</th>
              <th className="px-3 py-2 font-medium">Entidad</th>
              <th className="px-3 py-2 font-medium">Resumen</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map((e) => {
              const cambios = diffAudit(e.before, e.after);
              const esUpdate = e.action === "UPDATE";
              return (
                <tr key={e.id} className="border-b border-border align-top last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap tabular-nums">{formatAt(e.at)}</td>
                  <td className="px-3 py-2">{e.user?.name ?? e.user?.email ?? e.userEmail ?? "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{ACTION_LABELS[e.action] ?? e.action}</td>
                  <td className="px-3 py-2">{ENTITY_LABELS[e.entity] ?? e.entity}</td>
                  <td className="px-3 py-2">
                    {cambios.length === 0 ? (
                      summarize(e.before, e.after, e.userEmail)
                    ) : (
                      <details>
                        <summary className="cursor-pointer">{summarize(e.before, e.after, e.userEmail)}</summary>
                        <dl className="mt-2 space-y-1 text-xs">
                          {cambios.map((c) => (
                            <div key={c.field} className="break-all">
                              <dt className="inline font-medium text-muted">{c.field}: </dt>
                              <dd className="inline">
                                {esUpdate
                                  ? `${formatValue(c.before)} → ${formatValue(c.after)}`
                                  : formatValue(e.action === "DELETE" ? c.before : c.after)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <nav className="flex items-center justify-between text-sm">
        {pagina > 1 ? (
          <Link href={pageHref(pagina - 1)} className="hover:underline">← Más recientes</Link>
        ) : (
          <span />
        )}
        <span className="text-muted">Página {pagina}</span>
        {hayMas ? (
          <Link href={pageHref(pagina + 1)} className="hover:underline">Más antiguos →</Link>
        ) : (
          <span />
        )}
      </nav>
    </PageShell>
  );
}
