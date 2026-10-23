import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import {
  PERIODS,
  aggregateByCategory,
  aggregateTrend,
  buildTrendBuckets,
  formatMoneyWithSymbol,
  formatPercent,
  formatShortDate,
  getActiveBudgets,
  getPeriodRange,
  getTrendGranularity,
  isInRange,
  isPeriod,
  parseCategoryIds,
  parseIsoDate,
  shiftPeriod,
  sumAmounts,
  toIsoDate,
  todayUtc,
  toReportCurrencyBudgets,
  toReportCurrencyExpenses,
  type Period,
  type ReportCurrency,
} from "@/lib/reports";
import { CategoriasChart, TendenciaChart } from "@/app/reportes/graficos";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ periodo?: string; fecha?: string; cat?: string | string[] }>;

function periodHref(period: Period, date: Date, categoryIds: string[] = []): string {
  const query = new URLSearchParams({ periodo: period, fecha: toIsoDate(date) });
  for (const id of categoryIds) query.append("cat", id);
  return `/?${query}`;
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const period: Period = isPeriod(params.periodo) ? params.periodo : "mes";
  const today = todayUtc();
  const reference = parseIsoDate(params.fecha) ?? today;

  const range = getPeriodRange(period, reference);
  const granularity = getTrendGranularity(period);
  const buckets = buildTrendBuckets(range, granularity);

  const allCategories = await prisma.category.findMany({
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });
  const selectedIds = parseCategoryIds(
    params.cat,
    allCategories.map((c) => c.id),
  );
  const filtering = selectedIds.length > 0;
  const periodWhere = { date: { gte: range.start, lt: range.end } };
  const findExpenses = (where: Prisma.ExpenseWhereInput) =>
    prisma.expense.findMany({ where, include: { category: true }, orderBy: { date: "asc" } });

  const [settings, expenseRows, budgetExpenseRows, budgetRows] = await Promise.all([
    getSettings(),
    findExpenses(filtering ? { ...periodWhere, categoryId: { in: selectedIds } } : periodWhere),
    // El consumo de cada presupuesto se calcula con todos sus gastos, no solo los filtrados.
    filtering ? findExpenses(periodWhere) : null,
    prisma.budget.findMany({
      where: {
        startDate: { lte: range.lastDay },
        endDate: { gte: range.start },
        ...(filtering && {
          OR: [
            { categories: { some: { id: { in: selectedIds } } } },
            { categories: { none: {} } }, // sin categorías = aplica a todas
          ],
        }),
      },
      include: { categories: { select: { id: true } } },
      orderBy: { startDate: "asc" },
    }),
  ]);

  // Todos los totales se expresan en la moneda por defecto de la configuración.
  const fx: ReportCurrency = {
    target: settings.defaultCurrency,
    usdToGtq: settings.usdToGtq.toNumber(),
  };
  const symbol = CURRENCY_SYMBOL[settings.defaultCurrency];
  const money = (amount: number) => formatMoneyWithSymbol(amount, symbol);

  const toRecords = (rows: typeof expenseRows) =>
    toReportCurrencyExpenses(
      rows.map((e) => ({
        amount: e.amount.toNumber(),
        currency: e.currency,
        date: e.date,
        categoryId: e.categoryId,
        category: { id: e.category.id, name: e.category.name, color: e.category.color },
      })),
      fx,
    );
  const expenses = toRecords(expenseRows);
  const budgetExpenses = budgetExpenseRows ? toRecords(budgetExpenseRows) : expenses;

  const budgets = toReportCurrencyBudgets(
    budgetRows.map((b) => ({
      id: b.id,
      name: b.name,
      amount: b.amount.toNumber(),
      currency: b.currency,
      startDate: b.startDate,
      endDate: b.endDate,
      categoryIds: b.categories.map((c) => c.id),
    })),
    fx,
  );

  const total = sumAmounts(expenses);
  const categories = aggregateByCategory(expenses);
  const trend = aggregateTrend(expenses, buckets, granularity);
  const activeBudgets = getActiveBudgets(budgets, budgetExpenses, range);
  const isCurrentPeriod = isInRange(range, today);

  const prevHref = periodHref(period, shiftPeriod(period, reference, -1), selectedIds);
  const nextHref = periodHref(period, shiftPeriod(period, reference, 1), selectedIds);
  const todayHref = periodHref(period, today, selectedIds);

  const trendTitle = granularity === "day" ? "Gasto diario" : "Gasto mensual";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Reportes de gastos</h1>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <nav
              aria-label="Tipo de periodo"
              className="inline-flex w-fit rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-neutral-900 p-1 text-sm"
            >
              {PERIODS.map((option) => {
                const active = option.value === period;
                return (
                  <Link
                    key={option.value}
                    href={periodHref(option.value, reference, selectedIds)}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                      active
                        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-neutral-950"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
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
                className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-neutral-900 px-3 py-1.5 font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ← Anterior
              </Link>
              <span className="min-w-0 flex-1 truncate text-center font-medium sm:flex-none sm:px-2">
                {range.label}
              </span>
              {!isCurrentPeriod && (
                <Link
                  href={todayHref}
                  className="rounded-md px-2 py-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Hoy
                </Link>
              )}
              <Link
                href={nextHref}
                className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-neutral-900 px-3 py-1.5 font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Siguiente →
              </Link>
            </div>
          </div>

          {allCategories.length > 0 && (
            <form
              method="get"
              action="/"
              className="flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-neutral-900 p-4 text-sm"
            >
              <input type="hidden" name="periodo" value={period} />
              <input type="hidden" name="fecha" value={toIsoDate(reference)} />
              <fieldset className="flex flex-wrap gap-x-4 gap-y-2">
                <legend className="mb-2 font-medium text-zinc-500 dark:text-zinc-400">Categorías</legend>
                {allCategories.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      name="cat"
                      value={c.id}
                      defaultChecked={selectedIds.includes(c.id)}
                      className="size-4 accent-zinc-900 dark:accent-zinc-100"
                    />
                    <span
                      aria-hidden
                      className="inline-block size-2.5 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.name}
                  </label>
                ))}
              </fieldset>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 font-medium text-white dark:text-neutral-950 hover:bg-zinc-700 dark:hover:bg-zinc-300"
                >
                  Aplicar
                </button>
                <Link
                  href={periodHref(period, reference)}
                  aria-current={filtering ? undefined : "page"}
                  className="rounded-md border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Todas
                </Link>
                {filtering && (
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {selectedIds.length} de {allCategories.length} seleccionadas
                  </span>
                )}
              </div>
            </form>
          )}
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card label="Total gastado" value={money(total)} emphasis />
          <Card label="Gastos registrados" value={String(expenses.length)} />
          <Card label="Presupuestos activos" value={String(activeBudgets.length)} />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-neutral-900 p-5 lg:col-span-2">
            <h2 className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">{trendTitle}</h2>
            {expenses.length === 0 ? (
              <Empty />
            ) : (
              <TendenciaChart
                symbol={symbol}
                data={trend.map((p) => ({ label: p.label, total: p.total }))}
              />
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-neutral-900 p-5">
            <h2 className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">Gasto por categoría</h2>
            {categories.length === 0 ? (
              <Empty />
            ) : (
              <>
                <CategoriasChart
                  symbol={symbol}
                  data={categories.map((c) => ({
                    name: c.name,
                    total: c.total,
                    color: c.color,
                  }))}
                />
                <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
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
                      <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
                        {money(c.total)}{" "}
                        <span className="text-zinc-400 dark:text-zinc-600">({formatPercent(c.share)})</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-neutral-900 p-5">
          <h2 className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">Presupuestos activos</h2>
          {activeBudgets.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No hay presupuestos activos en este periodo.</p>
          ) : (
            <ul className="flex flex-col gap-5">
              {activeBudgets.map((b) => {
                const barWidth = Math.min(b.percent, 100);
                return (
                  <li key={b.id} className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <span className="font-medium">{b.name}</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatShortDate(b.startDate)} – {formatShortDate(b.endDate)}
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label={`Consumo de ${b.name}`}
                      aria-valuenow={Math.round(Math.min(b.percent, 100))}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900"
                    >
                      <div
                        className={`h-full rounded-full ${b.exceeded ? "bg-red-500 dark:bg-red-400" : "bg-zinc-700 dark:bg-zinc-300"}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap justify-between gap-x-4 text-xs text-zinc-600 dark:text-zinc-400 tabular-nums">
                      <span>
                        Gastado {money(b.spent)} de {money(b.amount)} (
                        {formatPercent(b.percent / 100)})
                      </span>
                      <span className={b.exceeded ? "font-medium text-red-600 dark:text-red-400" : ""}>
                        {b.exceeded
                          ? `Excedido por ${money(Math.abs(b.remaining))}`
                          : `Restante ${money(b.remaining)}`}
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
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-neutral-900 p-5">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p
        className={`mt-1 tabular-nums ${emphasis ? "text-3xl font-semibold" : "text-2xl font-medium"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Empty() {
  return <p className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">Sin gastos en este periodo.</p>;
}
