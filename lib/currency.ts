import { Prisma, type Currency } from "@prisma/client";

export const CURRENCY_LABEL: Record<Currency, string> = {
  GTQ: "Quetzales (Q)",
  USD: "Dólares ($)",
};

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  GTQ: "Q",
  USD: "$",
};

/**
 * Convierte un monto entre monedas.
 * `usdToGtq` son quetzales por dólar (por ejemplo, 7.5).
 * El resultado no se redondea: redondea solo al mostrarlo.
 */
export function convertAmount(
  amount: Prisma.Decimal,
  from: Currency,
  to: Currency,
  usdToGtq: Prisma.Decimal,
): Prisma.Decimal {
  if (from === to) return amount;
  if (from === "USD" && to === "GTQ") return amount.times(usdToGtq);
  return amount.div(usdToGtq); // GTQ -> USD
}
