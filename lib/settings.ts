import { Prisma, type Currency } from "@prisma/client";
import { prisma } from "@/lib/db";

export const DEFAULT_USD_TO_GTQ = new Prisma.Decimal("7.5");

export type AppSettings = {
  defaultCurrency: Currency;
  usdToGtq: Prisma.Decimal;
};

/** Devuelve la configuración global; la crea con valores por defecto si no existe. */
export async function getSettings(): Promise<AppSettings> {
  const row = await prisma.setting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  return { defaultCurrency: row.defaultCurrency, usdToGtq: row.usdToGtq };
}
