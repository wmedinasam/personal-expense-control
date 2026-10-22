/**
 * Cálculo de consumo de presupuestos. Función pura: no toca la base de datos
 * ni el reloj del sistema; todo llega por parámetro.
 *
 * Convenciones:
 * - Las fechas se tratan como días de calendario en UTC (así llegan los campos
 *   `@db.Date` desde Prisma, a medianoche UTC). Los rangos son inclusivos.
 * - Los importes se operan en céntimos para evitar errores de coma flotante.
 * - Un presupuesto sin categorías aplica a todos los gastos.
 */

export type BudgetForConsumption = {
  amount: number;
  startDate: Date;
  endDate: Date;
  /** Vacío = el presupuesto aplica a todas las categorías. */
  categoryIds: readonly string[];
};

export type ExpenseForConsumption = {
  amount: number;
  date: Date;
  categoryId: string;
};

export type BudgetConsumption = {
  /** Suma de los gastos que caen en el rango y en las categorías del presupuesto. */
  spent: number;
  /** Importe del presupuesto menos lo gastado. Negativo si se ha superado. */
  remaining: number;
  /** Porcentaje gastado sobre el importe (puede superar 100). */
  percentUsed: number;
  /** Días del presupuesto, ambos extremos incluidos. */
  totalDays: number;
  /** Días transcurridos desde el inicio hasta hoy, incluido hoy. Acotado a [0, totalDays]. */
  elapsedDays: number;
  /** Días que quedan, incluido hoy. 0 si el presupuesto ya terminó. */
  remainingDays: number;
  /**
   * Gasto diario máximo para no pasarse: lo que queda dividido entre los días
   * restantes (redondeado hacia abajo al céntimo). null si ya no quedan días.
   */
  suggestedDailyPace: number | null;
};

const DAY_MS = 86_400_000;

/** Número de día (entero) de una fecha, tomando su día de calendario en UTC. */
export function toDayNumber(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_MS;
}

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function computeBudgetConsumption(
  budget: BudgetForConsumption,
  expenses: readonly ExpenseForConsumption[],
  today: Date,
): BudgetConsumption {
  const startDay = toDayNumber(budget.startDate);
  const endDay = toDayNumber(budget.endDate);
  const todayDay = toDayNumber(today);

  const totalDays = Math.max(0, endDay - startDay + 1);

  const appliesToAllCategories = budget.categoryIds.length === 0;
  const categorySet = new Set(budget.categoryIds);

  let spentCents = 0;
  for (const expense of expenses) {
    const day = toDayNumber(expense.date);
    if (day < startDay || day > endDay) continue;
    if (!appliesToAllCategories && !categorySet.has(expense.categoryId)) continue;
    spentCents += toCents(expense.amount);
  }

  const budgetCents = toCents(budget.amount);
  const remainingCents = budgetCents - spentCents;
  const percentUsed = budgetCents > 0 ? (spentCents / budgetCents) * 100 : 0;

  // Hoy cuenta como día transcurrido y como día restante.
  const elapsedDays = Math.min(Math.max(todayDay - startDay + 1, 0), totalDays);
  const remainingDays =
    todayDay > endDay ? 0 : Math.max(0, endDay - Math.max(todayDay, startDay) + 1);

  const suggestedDailyPace =
    remainingDays > 0
      ? Math.floor(Math.max(0, remainingCents) / remainingDays) / 100
      : null;

  return {
    spent: spentCents / 100,
    remaining: remainingCents / 100,
    percentUsed,
    totalDays,
    elapsedDays,
    remainingDays,
    suggestedDailyPace,
  };
}
