const moneyFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}

/** Las fechas de `@db.Date` llegan a medianoche UTC, por eso se formatean en UTC. */
export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}
