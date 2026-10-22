/**
 * Funciones puras para los reportes del dashboard.
 *
 * Las fechas se manejan en UTC a medianoche, igual que las columnas
 * `@db.Date` de Prisma, para evitar desfases por zona horaria.
 * No dependen de Prisma: reciben datos planos, así son fáciles de probar.
 */

export type Period = "mes" | "trimestre" | "anio";
export type Granularity = "day" | "month";

export interface PeriodRange {
  period: Period;
  start: Date; // incluido
  end: Date; // excluido
  lastDay: Date; // incluido
  label: string;
}

export interface ExpenseRecord {
  amount: number;
  date: Date;
  categoryId: string;
  category: { id: string; name: string; color: string };
}

export interface BudgetRecord {
  id: string;
  name: string;
  amount: number;
  startDate: Date;
  endDate: Date; // incluido
  categoryIds: string[];
}

export interface CategoryTotal {
  categoryId: string;
  name: string;
  color: string;
  total: number;
  count: number;
  share: number; // fracción entre 0 y 1
}

export interface TrendBucket {
  key: string;
  label: string;
  start: Date;
  end: Date; // excluido
}

export interface TrendPoint {
  key: string;
  label: string;
  total: number;
}

export interface BudgetStatus {
  id: string;
  name: string;
  amount: number;
  startDate: Date;
  endDate: Date;
  spent: number;
  remaining: number;
  percent: number; // puede superar 100
  exceeded: boolean;
}

export const PERIODS: ReadonlyArray<{ value: Period; label: string }> = [
  { value: "mes", label: "Mes" },
  { value: "trimestre", label: "Trimestre" },
  { value: "anio", label: "Año" },
];

const DAY_MS = 24 * 60 * 60 * 1000;

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const MONTHS_SHORT_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const MONTHS_IN_PERIOD: Record<Period, number> = {
  mes: 1,
  trimestre: 3,
  anio: 12,
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const toCents = (amount: number) => Math.round(amount * 100);
const fromCents = (cents: number) => cents / 100;

export function isPeriod(value: unknown): value is Period {
  return value === "mes" || value === "trimestre" || value === "anio";
}

/** Convierte "YYYY-MM-DD" a Date UTC. Devuelve null si el formato o la fecha no son válidos. */
export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

export function toIsoDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

/** Hoy según la fecha local del servidor, expresado como Date UTC a medianoche. */
export function todayUtc(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export function getPeriodRange(period: Period, reference: Date): PeriodRange {
  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth();
  const firstMonth =
    period === "anio" ? 0 : period === "trimestre" ? Math.floor(month / 3) * 3 : month;
  const start = new Date(Date.UTC(year, firstMonth, 1));
  const end = new Date(Date.UTC(year, firstMonth + MONTHS_IN_PERIOD[period], 1));

  return {
    period,
    start,
    end,
    lastDay: new Date(end.getTime() - DAY_MS),
    label: periodLabel(period, year, firstMonth),
  };
}

function periodLabel(period: Period, year: number, firstMonth: number): string {
  if (period === "anio") return String(year);
  if (period === "trimestre") return `${firstMonth / 3 + 1}.º trimestre ${year}`;
  const name = MONTHS_ES[firstMonth];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

/** Devuelve el primer día del periodo anterior (-1) o siguiente (+1) respecto a `reference`. */
export function shiftPeriod(period: Period, reference: Date, step: 1 | -1): Date {
  const base = getPeriodRange(period, reference).start;
  return new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + step * MONTHS_IN_PERIOD[period], 1),
  );
}

export function isInRange(range: PeriodRange, date: Date): boolean {
  return date.getTime() >= range.start.getTime() && date.getTime() < range.end.getTime();
}

/** Mes: tendencia diaria. Trimestre y año: tendencia mensual. */
export function getTrendGranularity(period: Period): Granularity {
  return period === "mes" ? "day" : "month";
}

/** Genera todos los cubos (días o meses) del rango, incluidos los que no tienen gastos. */
export function buildTrendBuckets(range: PeriodRange, granularity: Granularity): TrendBucket[] {
  const buckets: TrendBucket[] = [];

  if (granularity === "day") {
    for (let t = range.start.getTime(); t < range.end.getTime(); t += DAY_MS) {
      const start = new Date(t);
      buckets.push({
        key: toIsoDate(start),
        label: String(start.getUTCDate()),
        start,
        end: new Date(t + DAY_MS),
      });
    }
    return buckets;
  }

  let year = range.start.getUTCFullYear();
  let month = range.start.getUTCMonth();
  while (Date.UTC(year, month, 1) < range.end.getTime()) {
    const start = new Date(Date.UTC(year, month, 1));
    const label = month === 0 ? `${MONTHS_SHORT_ES[month]} ${year}` : MONTHS_SHORT_ES[month];
    buckets.push({
      key: `${year}-${pad2(month + 1)}`,
      label,
      start,
      end: new Date(Date.UTC(year, month + 1, 1)),
    });
    month += 1;
    if (month === 12) {
      month = 0;
      year += 1;
    }
  }
  return buckets;
}

/** Suma total de los importes, redondeada a centavos para evitar errores de coma flotante. */
export function sumAmounts(expenses: ExpenseRecord[]): number {
  return fromCents(expenses.reduce((acc, e) => acc + toCents(e.amount), 0));
}

/** Gasto por categoría, ordenado de mayor a menor. */
export function aggregateByCategory(expenses: ExpenseRecord[]): CategoryTotal[] {
  const groups = new Map<
    string,
    { name: string; color: string; cents: number; count: number }
  >();

  for (const e of expenses) {
    const current = groups.get(e.categoryId) ?? {
      name: e.category.name,
      color: e.category.color,
      cents: 0,
      count: 0,
    };
    current.cents += toCents(e.amount);
    current.count += 1;
    groups.set(e.categoryId, current);
  }

  const totalCents = [...groups.values()].reduce((acc, g) => acc + g.cents, 0);

  return [...groups.entries()]
    .map(([categoryId, g]) => ({
      categoryId,
      name: g.name,
      color: g.color,
      total: fromCents(g.cents),
      count: g.count,
      share: totalCents === 0 ? 0 : g.cents / totalCents,
    }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "es"));
}

/** Total por cubo de tendencia. Los cubos sin gastos aparecen con total 0. */
export function aggregateTrend(
  expenses: ExpenseRecord[],
  buckets: TrendBucket[],
  granularity: Granularity,
): TrendPoint[] {
  const cents = new Map<string, number>();

  for (const e of expenses) {
    const iso = toIsoDate(e.date);
    const key = granularity === "day" ? iso : iso.slice(0, 7);
    cents.set(key, (cents.get(key) ?? 0) + toCents(e.amount));
  }

  return buckets.map((b) => ({
    key: b.key,
    label: b.label,
    total: fromCents(cents.get(b.key) ?? 0),
  }));
}

/**
 * Presupuestos que se solapan con el periodo. El gasto de cada presupuesto
 * cuenta solo los gastos de sus categorías dentro de la intersección entre
 * las fechas del presupuesto y las del periodo.
 */
export function getActiveBudgets(
  budgets: BudgetRecord[],
  expenses: ExpenseRecord[],
  range: PeriodRange,
): BudgetStatus[] {
  return budgets
    .filter((b) => b.startDate <= range.lastDay && b.endDate >= range.start)
    .map((b) => {
      const from = b.startDate.getTime() > range.start.getTime() ? b.startDate : range.start;
      const untilEndExclusive = Math.min(range.end.getTime(), b.endDate.getTime() + DAY_MS);
      const categories = new Set(b.categoryIds);

      const spentCents = expenses
        .filter(
          (e) =>
            categories.has(e.categoryId) &&
            e.date.getTime() >= from.getTime() &&
            e.date.getTime() < untilEndExclusive,
        )
        .reduce((acc, e) => acc + toCents(e.amount), 0);

      const budgetCents = toCents(b.amount);
      return {
        id: b.id,
        name: b.name,
        amount: b.amount,
        startDate: b.startDate,
        endDate: b.endDate,
        spent: fromCents(spentCents),
        remaining: fromCents(budgetCents - spentCents),
        percent: budgetCents === 0 ? 0 : (spentCents / budgetCents) * 100,
        exceeded: spentCents > budgetCents,
      };
    });
}

const moneyFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(amount: number): string {
  return moneyFormatter.format(amount);
}

export function formatPercent(fraction: number): string {
  return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(fraction * 100)} %`;
}

export function formatShortDate(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS_SHORT_ES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
