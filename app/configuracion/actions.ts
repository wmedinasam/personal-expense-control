"use server";

import { revalidatePath } from "next/cache";
import { Prisma, Currency } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function updateSettings(formData: FormData) {
  const user = await requireAdmin();
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

  const data = { defaultCurrency: defaultCurrency as Currency, usdToGtq: rate, updatedById: user.id };
  await prisma.$transaction(async (tx) => {
    const before = await tx.setting.findUnique({ where: { id: "default" } });
    const after = before
      ? await tx.setting.update({ where: { id: "default" }, data })
      : await tx.setting.create({ data: { id: "default", ...data, createdById: user.id } });
    await audit(tx, {
      userId: user.id,
      userEmail: user.email,
      action: before ? "UPDATE" : "CREATE",
      entity: "Setting",
      entityId: "default",
      before,
      after,
    });
  });

  revalidatePath("/configuracion");
}
