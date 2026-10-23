import type { Currency } from "@prisma/client";
import { CURRENCY_SYMBOL } from "@/lib/currency";

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

/** Importe con el símbolo de su moneda, por ejemplo "Q 1.250,00" o "$ 10,00". */
export function formatMoney(value: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOL[currency];
  if (value < 0) return `-${symbol} ${moneyFormatter.format(-value)}`;
  return `${symbol} ${moneyFormatter.format(value)}`;
}

/** Las fechas de `@db.Date` llegan a medianoche UTC, por eso se formatean en UTC. */
export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}
