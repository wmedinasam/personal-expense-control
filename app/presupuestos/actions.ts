"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import {
  readRawBudgetInput,
  validateBudgetInput,
  type BudgetFormState,
} from "@/lib/budgets";

const PAGE = "/presupuestos";

const WITH_CATEGORY_IDS = { categories: { select: { id: true } } } as const;

/** Presupuesto como queda en la auditoría: categorías como lista de ids. */
function snapshot<T extends { categories: { id: string }[] }>({ categories, ...rest }: T) {
  return { ...rest, categoryIds: categories.map((c) => c.id) };
}

export async function createBudget(
  _previous: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const user = await requireUser();
  const raw = readRawBudgetInput(formData);
  const result = await validateBudgetInput(raw);
  if (!result.ok) return { error: result.error, values: raw };

  const { name, amount, currency, startDate, endDate, categoryIds } = result.data;
  await prisma.$transaction(async (tx) => {
    const after = await tx.budget.create({
      data: {
        name,
        amount,
        currency,
        startDate,
        endDate,
        categories: { connect: categoryIds.map((id) => ({ id })) },
        createdById: user.id,
        updatedById: user.id,
      },
      include: WITH_CATEGORY_IDS,
    });
    await audit(tx, {
      userId: user.id,
      userEmail: user.email,
      action: "CREATE",
      entity: "Budget",
      entityId: after.id,
      after: snapshot(after),
    });
  });

  revalidatePath(PAGE);
  redirect(PAGE);
}

export async function updateBudget(
  _previous: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const raw = readRawBudgetInput(formData);
  const notFound = { error: "El presupuesto no existe. Puede que se haya eliminado.", values: raw };
  if (!id) return notFound;

  const result = await validateBudgetInput(raw);
  if (!result.ok) return { error: result.error, values: raw };

  const { name, amount, currency, startDate, endDate, categoryIds } = result.data;
  const updated = await prisma.$transaction(async (tx) => {
    const before = await tx.budget.findUnique({ where: { id }, include: WITH_CATEGORY_IDS });
    if (!before) return false;
    const after = await tx.budget.update({
      where: { id },
      data: {
        name,
        amount,
        currency,
        startDate,
        endDate,
        categories: { set: categoryIds.map((categoryId) => ({ id: categoryId })) },
        updatedById: user.id,
      },
      include: WITH_CATEGORY_IDS,
    });
    await audit(tx, {
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE",
      entity: "Budget",
      entityId: id,
      before: snapshot(before),
      after: snapshot(after),
    });
    return true;
  });
  if (!updated) return notFound;

  revalidatePath(PAGE);
  redirect(PAGE);
}

export async function deleteBudget(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.$transaction(async (tx) => {
      const before = await tx.budget.findUnique({ where: { id }, include: WITH_CATEGORY_IDS });
      if (!before) return; // ya eliminado: nada que auditar
      await tx.budget.delete({ where: { id } });
      await audit(tx, {
        userId: user.id,
        userEmail: user.email,
        action: "DELETE",
        entity: "Budget",
        entityId: id,
        before: snapshot(before),
      });
    });
  }
  revalidatePath(PAGE);
}
