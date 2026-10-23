import Link from "next/link";
import { notFound } from "next/navigation";
import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ACTION_LABELS, ENTITY_LABELS, diffAudit, formatAt, formatValue, parseDmy, summarize } from "@/lib/audit-view";

export const metadata = { title: "Auditoría" };

const PAGE_SIZE = 50;

type SearchParams = Record<string, string | string[] | undefined>;

const single = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").trim();

const fieldClass =
  "rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-100";
const labelClass = "text-xs font-medium text-neutral-600 dark:text-neutral-400";

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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 text-neutral-900 dark:text-neutral-100">
      <h1 className="text-2xl font-semibold">Auditoría</h1>

      <form
        method="get"
        action="/auditoria"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="usuario" className={labelClass}>Usuario</label>
          <select id="usuario" name="usuario" defaultValue={usuario} className={fieldClass}>
            <option value="">Todos</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="entidad" className={labelClass}>Entidad</label>
          <select id="entidad" name="entidad" defaultValue={entidad} className={fieldClass}>
            <option value="">Todas</option>
            {Object.entries(ENTITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="accion" className={labelClass}>Acción</label>
          <select id="accion" name="accion" defaultValue={accion} className={fieldClass}>
            <option value="">Todas</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="desde" className={labelClass}>Desde</label>
          <input id="desde" name="desde" placeholder="dd/mm/aaaa" defaultValue={desdeText} className={`${fieldClass} w-32`} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="hasta" className={labelClass}>Hasta</label>
          <input id="hasta" name="hasta" placeholder="dd/mm/aaaa" defaultValue={hastaText} className={`${fieldClass} w-32`} />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Aplicar
          </button>
          {hayFiltros && (
            <Link href="/auditoria" className="text-sm text-neutral-600 hover:underline dark:text-neutral-400">
              Limpiar
            </Link>
          )}
        </div>
      </form>

      {avisos.map((a) => (
        <p key={a} className="text-sm text-amber-700 dark:text-amber-400">{a}</p>
      ))}

      {eventos.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">No hay eventos.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              <tr>
                <th className="py-2 pr-3 font-medium">Fecha</th>
                <th className="py-2 pr-3 font-medium">Usuario</th>
                <th className="py-2 pr-3 font-medium">Acción</th>
                <th className="py-2 pr-3 font-medium">Entidad</th>
                <th className="py-2 font-medium">Resumen</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((e) => {
                const cambios = diffAudit(e.before, e.after);
                const esUpdate = e.action === "UPDATE";
                return (
                  <tr key={e.id} className="border-b border-neutral-200 align-top dark:border-neutral-800">
                    <td className="py-2 pr-3 whitespace-nowrap tabular-nums">{formatAt(e.at)}</td>
                    <td className="py-2 pr-3">{e.user?.name ?? e.user?.email ?? e.userEmail ?? "—"}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{ACTION_LABELS[e.action] ?? e.action}</td>
                    <td className="py-2 pr-3">{ENTITY_LABELS[e.entity] ?? e.entity}</td>
                    <td className="py-2">
                      {cambios.length === 0 ? (
                        summarize(e.before, e.after, e.userEmail)
                      ) : (
                        <details>
                          <summary className="cursor-pointer">{summarize(e.before, e.after, e.userEmail)}</summary>
                          <dl className="mt-2 space-y-1 text-xs">
                            {cambios.map((c) => (
                              <div key={c.field} className="break-all">
                                <dt className="inline font-medium text-neutral-500 dark:text-neutral-400">{c.field}: </dt>
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
          </table>
        </div>
      )}

      <nav className="flex items-center justify-between text-sm">
        {pagina > 1 ? (
          <Link href={pageHref(pagina - 1)} className="hover:underline">← Más recientes</Link>
        ) : (
          <span />
        )}
        <span className="text-neutral-500 dark:text-neutral-400">Página {pagina}</span>
        {hayMas ? (
          <Link href={pageHref(pagina + 1)} className="hover:underline">Más antiguos →</Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
