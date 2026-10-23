"use server";

import { revalidatePath } from "next/cache";
import { Prisma, Currency } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function updateSettings(formData: FormData) {
  const defaultCurrency = String(formData.get("defaultCurrency"));
  const rawRate = String(formData.get("usdToGtq")).trim();

  if (!Object.values(Currency).includes(defaultCurrency as Currency)) {
    throw new Error("Moneda no válida.");
  }

  let rate: Prisma.Decimal;
  try {
    rate = new Prisma.Decimal(rawRate);
  } catch {
    throw new Error("El tipo de cambio no es un número válido.");
  }
  if (!rate.isFinite() || rate.lte(0)) {
    throw new Error("El tipo de cambio debe ser mayor que 0.");
  }

  await prisma.setting.upsert({
    where: { id: "default" },
    update: { defaultCurrency: defaultCurrency as Currency, usdToGtq: rate },
    create: { id: "default", defaultCurrency: defaultCurrency as Currency, usdToGtq: rate },
  });

  revalidatePath("/configuracion");
}
