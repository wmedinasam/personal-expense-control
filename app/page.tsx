import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  PERIODS,
  aggregateByCategory,
  aggregateTrend,
  buildTrendBuckets,
  formatMoney,
  formatPercent,
  formatShortDate,
  getActiveBudgets,
  getPeriodRange,
  getTrendGranularity,
  isInRange,
  isPeriod,
  parseIsoDate,
  shiftPeriod,
  sumAmounts,
  toIsoDate,
  todayUtc,
  type Period,
} from "@/lib/reports";
import { CategoriasChart, TendenciaChart } from "@/app/reportes/graficos";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ periodo?: string; fecha?: string }>;

function periodHref(period: Period, date: Date): string {
  return `/?periodo=${period}&fecha=${toIsoDate(date)}`;
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const period: Period = isPeriod(params.periodo) ? params.periodo : "mes";
  const today = todayUtc();
  const reference = parseIsoDate(params.fecha) ?? today;

  const range = getPeriodRange(period, reference);
  const granularity = getTrendGranularity(period);
  const buckets = buildTrendBuckets(range, granularity);

  const [expenseRows, budgetRows] = await Promise.all([
    prisma.expense.findMany({
      where: { date: { gte: range.start, lt: range.end } },
      include: { category: true },
      orderBy: { date: "asc" },
    }),
    prisma.budget.findMany({
      where: { startDate: { lte: range.lastDay }, endDate: { gte: range.start } },
      include: { categories: { select: { id: true } } },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const expenses = expenseRows.map((e) => ({
    amount: e.amount.toNumber(),
    date: e.date,
    categoryId: e.categoryId,
    category: { id: e.category.id, name: e.category.name, color: e.category.color },
  }));

  const budgets = budgetRows.map((b) => ({
    id: b.id,
    name: b.name,
    amount: b.amount.toNumber(),
    startDate: b.startDate,
    endDate: b.endDate,
    categoryIds: b.categories.map((c) => c.id),
  }));

  const total = sumAmounts(expenses);
  const categories = aggregateByCategory(expenses);
  const trend = aggregateTrend(expenses, buckets, granularity);
  const activeBudgets = getActiveBudgets(budgets, expenses, range);
  const isCurrentPeriod = isInRange(range, today);

  const prevHref = periodHref(period, shiftPeriod(period, reference, -1));
  const nextHref = periodHref(period, shiftPeriod(period, reference, 1));
  const todayHref = periodHref(period, today);

  const trendTitle = granularity === "day" ? "Gasto diario" : "Gasto mensual";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Reportes de gastos</h1>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <nav
              aria-label="Tipo de periodo"
              className="inline-flex w-fit rounded-lg border border-zinc-200 bg-white p-1 text-sm"
            >
              {PERIODS.map((option) => {
                const active = option.value === period;
                return (
                  <Link
                    key={option.value}
                    href={periodHref(option.value, reference)}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                      active
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    }`}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center justify-between gap-2 text-sm sm:justify-end">
              <Link
                href={prevHref}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100"
              >
                ← Anterior
              </Link>
              <span className="min-w-0 flex-1 truncate text-center font-medium sm:flex-none sm:px-2">
                {range.label}
              </span>
              {!isCurrentPeriod && (
                <Link
                  href={todayHref}
                  className="rounded-md px-2 py-1.5 text-zinc-500 hover:text-zinc-900"
                >
                  Hoy
                </Link>
              )}
              <Link
                href={nextHref}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Siguiente →
              </Link>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card label="Total gastado" value={formatMoney(total)} emphasis />
          <Card label="Gastos registrados" value={String(expenses.length)} />
          <Card label="Presupuestos activos" value={String(activeBudgets.length)} />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-2">
            <h2 className="mb-4 text-sm font-medium text-zinc-500">{trendTitle}</h2>
            {expenses.length === 0 ? (
              <Empty />
            ) : (
              <TendenciaChart data={trend.map((p) => ({ label: p.label, total: p.total }))} />
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-medium text-zinc-500">Gasto por categoría</h2>
            {categories.length === 0 ? (
              <Empty />
            ) : (
              <>
                <CategoriasChart
                  data={categories.map((c) => ({
                    name: c.name,
                    total: c.total,
                    color: c.color,
                  }))}
                />
                <ul className="mt-4 divide-y divide-zinc-100 text-sm">
                  {categories.map((c) => (
                    <li key={c.categoryId} className="flex items-center justify-between py-2">
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="inline-block size-2.5 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        {c.name}
                      </span>
                      <span className="tabular-nums text-zinc-600">
                        {formatMoney(c.total)}{" "}
                        <span className="text-zinc-400">({formatPercent(c.share)})</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-medium text-zinc-500">Presupuestos activos</h2>
          {activeBudgets.length === 0 ? (
            <p className="text-sm text-zinc-500">No hay presupuestos activos en este periodo.</p>
          ) : (
            <ul className="flex flex-col gap-5">
              {activeBudgets.map((b) => {
                const barWidth = Math.min(b.percent, 100);
                return (
                  <li key={b.id} className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <span className="font-medium">{b.name}</span>
                      <span className="text-xs text-zinc-500">
                        {formatShortDate(b.startDate)} – {formatShortDate(b.endDate)}
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label={`Consumo de ${b.name}`}
                      aria-valuenow={Math.round(Math.min(b.percent, 100))}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-2 w-full overflow-hidden rounded-full bg-zinc-100"
                    >
                      <div
                        className={`h-full rounded-full ${b.exceeded ? "bg-red-500" : "bg-zinc-700"}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap justify-between gap-x-4 text-xs text-zinc-600 tabular-nums">
                      <span>
                        Gastado {formatMoney(b.spent)} de {formatMoney(b.amount)} (
                        {formatPercent(b.percent / 100)})
                      </span>
                      <span className={b.exceeded ? "font-medium text-red-600" : ""}>
                        {b.exceeded
                          ? `Excedido por ${formatMoney(Math.abs(b.remaining))}`
                          : `Restante ${formatMoney(b.remaining)}`}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function Card({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p
        className={`mt-1 tabular-nums ${emphasis ? "text-3xl font-semibold" : "text-2xl font-medium"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Empty() {
  return <p className="py-12 text-center text-sm text-zinc-500">Sin gastos en este periodo.</p>;
}
