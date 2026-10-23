"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  getBudgetById,
  readRawBudgetInput,
  validateBudgetInput,
  type BudgetFormState,
} from "@/lib/budgets";

const PAGE = "/presupuestos";

export async function createBudget(
  _previous: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const raw = readRawBudgetInput(formData);
  const result = await validateBudgetInput(raw);
  if (!result.ok) return { error: result.error, values: raw };

  const { name, amount, currency, startDate, endDate, categoryIds } = result.data;
  await prisma.budget.create({
    data: {
      name,
      amount,
      currency,
      startDate,
      endDate,
      categories: { connect: categoryIds.map((id) => ({ id })) },
    },
  });

  revalidatePath(PAGE);
  redirect(PAGE);
}

export async function updateBudget(
  _previous: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const id = String(formData.get("id") ?? "");
  const raw = readRawBudgetInput(formData);

  const existing = id ? await getBudgetById(id) : null;
  if (!existing) {
    return { error: "El presupuesto no existe. Puede que se haya eliminado.", values: raw };
  }

  const result = await validateBudgetInput(raw);
  if (!result.ok) return { error: result.error, values: raw };

  const { name, amount, currency, startDate, endDate, categoryIds } = result.data;
  await prisma.budget.update({
    where: { id },
    data: {
      name,
      amount,
      currency,
      startDate,
      endDate,
      categories: { set: categoryIds.map((categoryId) => ({ id: categoryId })) },
    },
  });

  revalidatePath(PAGE);
  redirect(PAGE);
}

export async function deleteBudget(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.budget.deleteMany({ where: { id } });
  }
  revalidatePath(PAGE);
}
