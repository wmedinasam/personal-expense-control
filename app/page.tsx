import Link from "next/link";
import type { Prisma } from "@prisma/client";
import CategoryIcon from "@/app/categorias/CategoryIcon";
import { Button, Card, EmptyState, PageShell } from "@/app/_components/ui";
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
    select: { id: true, name: true, color: true, icon: true },
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
        category: { id: e.category.id, name: e.category.name, color: e.category.color, icon: e.category.icon },
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
    <PageShell title="Reportes de gastos">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav
            aria-label="Tipo de periodo"
            className="inline-flex w-fit rounded-lg border border-border bg-surface p-1 text-sm"
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
                      ? "bg-accent text-accent-fg"
                      : "text-muted hover:bg-surface-2 hover:text-foreground"
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
              className="rounded-md border border-border bg-surface px-3 py-1.5 font-medium text-foreground hover:bg-surface-2"
            >
              ← Anterior
            </Link>
            <span className="min-w-0 flex-1 truncate text-center font-medium sm:flex-none sm:px-2">
              {range.label}
            </span>
            {!isCurrentPeriod && (
              <Link href={todayHref} className="rounded-md px-2 py-1.5 text-muted hover:text-foreground">
                Hoy
              </Link>
            )}
            <Link
              href={nextHref}
              className="rounded-md border border-border bg-surface px-3 py-1.5 font-medium text-foreground hover:bg-surface-2"
            >
              Siguiente →
            </Link>
          </div>
        </div>

        {allCategories.length > 0 && (
          <form
            method="get"
            action="/"
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 text-sm"
          >
            <input type="hidden" name="periodo" value={period} />
            <input type="hidden" name="fecha" value={toIsoDate(reference)} />
            <fieldset className="flex flex-wrap gap-x-4 gap-y-2">
              <legend className="mb-2 font-medium text-muted">Categorías</legend>
              {allCategories.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2 text-foreground">
                  <input
                    type="checkbox"
                    name="cat"
                    value={c.id}
                    defaultChecked={selectedIds.includes(c.id)}
                    className="size-4 accent-accent"
                  />
                  <CategoryIcon icon={c.icon} color={c.color} size={14} />
                  {c.name}
                </label>
              ))}
            </fieldset>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" variant="primary" className="px-3 py-1.5">
                Aplicar
              </Button>
              <Link
                href={periodHref(period, reference)}
                aria-current={filtering ? undefined : "page"}
                className="rounded-md border border-border bg-surface-2 px-3 py-1.5 font-medium text-foreground hover:bg-border"
              >
                Todas
              </Link>
              {filtering && (
                <span className="text-muted">
                  {selectedIds.length} de {allCategories.length} seleccionadas
                </span>
              )}
            </div>
          </form>
        )}
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Total gastado" value={money(total)} emphasis />
        <Stat label="Gastos registrados" value={String(expenses.length)} />
        <Stat label="Presupuestos activos" value={String(activeBudgets.length)} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-medium text-muted">{trendTitle}</h2>
          {expenses.length === 0 ? (
            <Empty />
          ) : (
            <TendenciaChart
              symbol={symbol}
              data={trend.map((p) => ({ label: p.label, total: p.total }))}
            />
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-medium text-muted">Gasto por categoría</h2>
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
              <ul className="mt-4 divide-y divide-border text-sm">
                {categories.map((c) => (
                  <li key={c.categoryId} className="flex items-center justify-between py-2">
                    <span className="flex items-center gap-2">
                      <CategoryIcon icon={c.icon} color={c.color} />
                      {c.name}
                    </span>
                    <span className="tabular-nums text-muted">
                      {money(c.total)}{" "}
                      <span className="text-muted/70">({formatPercent(c.share)})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </section>

      <Card>
        <h2 className="mb-4 text-sm font-medium text-muted">Presupuestos activos</h2>
        {activeBudgets.length === 0 ? (
          <p className="text-sm text-muted">No hay presupuestos activos en este periodo.</p>
        ) : (
          <ul className="flex flex-col gap-5">
            {activeBudgets.map((b) => {
              const barWidth = Math.min(b.percent, 100);
              return (
                <li key={b.id} className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <span className="font-medium">{b.name}</span>
                    <span className="text-xs text-muted">
                      {formatShortDate(b.startDate)} – {formatShortDate(b.endDate)}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`Consumo de ${b.name}`}
                    aria-valuenow={Math.round(Math.min(b.percent, 100))}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
                  >
                    <div
                      className={`h-full rounded-full ${b.exceeded ? "bg-danger" : "bg-accent"}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-4 text-xs tabular-nums text-muted">
                    <span>
                      Gastado {money(b.spent)} de {money(b.amount)} (
                      {formatPercent(b.percent / 100)})
                    </span>
                    <span className={b.exceeded ? "font-medium text-danger" : ""}>
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
      </Card>
    </PageShell>
  );
}

function Stat({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 tabular-nums ${emphasis ? "text-3xl font-semibold" : "text-2xl font-medium"}`}>
        {value}
      </p>
    </Card>
  );
}

function Empty() {
  return <EmptyState>Sin gastos en este periodo.</EmptyState>;
}
