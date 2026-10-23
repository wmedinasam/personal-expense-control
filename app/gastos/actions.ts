"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  createExpense,
  deleteExpense,
  updateExpense,
  validateExpenseInput,
  type ActionResult,
} from "@/lib/expenses";
import { requireUser } from "@/lib/auth";

function toRecord(formData: FormData): Record<string, string> {
  const record: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") record[key] = value;
  }
  return record;
}

function isNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

export async function crearGasto(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const input = await validateExpenseInput(toRecord(formData));
  if (!input.ok) {
    return {
      ok: false,
      message: "Revisa los campos marcados.",
      fieldErrors: input.fieldErrors,
    };
  }

  await createExpense(input.data, user.id);
  revalidatePath("/gastos");
  return { ok: true, message: "Gasto añadido." };
}

export async function editarGasto(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, message: "Gasto no válido." };
  }

  const input = await validateExpenseInput(toRecord(formData));
  if (!input.ok) {
    return {
      ok: false,
      message: "Revisa los campos marcados.",
      fieldErrors: input.fieldErrors,
    };
  }

  try {
    await updateExpense(id, input.data, user.id);
  } catch (error) {
    if (isNotFound(error)) {
      return { ok: false, message: "El gasto ya no existe." };
    }
    throw error;
  }

  revalidatePath("/gastos");
  return { ok: true, message: "Gasto actualizado." };
}

export async function borrarGasto(id: string): Promise<ActionResult> {
  const user = await requireUser();
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, message: "Gasto no válido." };
  }

  try {
    await deleteExpense(id, user.id);
  } catch (error) {
    if (isNotFound(error)) {
      return { ok: false, message: "El gasto ya no existe." };
    }
    throw error;
  }

  revalidatePath("/gastos");
  return { ok: true, message: "Gasto borrado." };
}
