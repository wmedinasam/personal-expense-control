"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  countCategoryExpenses,
  validateCategoryFields,
} from "@/lib/categories";
import type { ActionResult, CategoryFields } from "@/app/categorias/shared";

function readFields(formData: FormData): CategoryFields {
  return {
    name: String(formData.get("name") ?? ""),
    color: String(formData.get("color") ?? ""),
    icon: String(formData.get("icon") ?? ""),
    iconData: String(formData.get("iconData") ?? ""),
  };
}

function readId(formData: FormData): string {
  return String(formData.get("id") ?? "").trim();
}

function unexpectedError(context: string, e: unknown): ActionResult {
  console.error(`[categorias] ${context}`, e);
  return { ok: false, error: "No se pudo completar la operación. Inténtalo de nuevo." };
}

export async function createCategory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = await validateCategoryFields(readFields(formData));
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    const created = await prisma.category.create({ data: parsed.data });
    revalidatePath("/categorias");
    return { ok: true, message: `Categoría «${created.name}» creada.` };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: `Ya existe una categoría llamada «${parsed.data.name}».` };
    }
    return unexpectedError("createCategory", e);
  }
}

export async function updateCategory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = readId(formData);
  if (!id) return { ok: false, error: "Falta el identificador de la categoría." };

  const existing = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, error: "La categoría ya no existe." };

  const parsed = await validateCategoryFields(readFields(formData), id);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    const updated = await prisma.category.update({ where: { id }, data: parsed.data });
    revalidatePath("/categorias");
    return { ok: true, message: `Categoría «${updated.name}» guardada.` };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: `Ya existe una categoría llamada «${parsed.data.name}».` };
    }
    return unexpectedError("updateCategory", e);
  }
}

export async function deleteCategory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = readId(formData);
  if (!id) return { ok: false, error: "Falta el identificador de la categoría." };

  const category = await prisma.category.findUnique({
    where: { id },
    select: { name: true },
  });
  if (!category) return { ok: false, error: "La categoría ya no existe." };

  const blocking = (count: number) =>
    `No se puede borrar «${category.name}» porque tiene ${count} gasto${count === 1 ? "" : "s"} asociado${count === 1 ? "" : "s"}.`;

  try {
    const expenseCount = await countCategoryExpenses(id);
    if (expenseCount > 0) return { ok: false, error: blocking(expenseCount) };

    await prisma.category.delete({ where: { id } });
    revalidatePath("/categorias");
    return { ok: true, message: `Categoría «${category.name}» borrada.` };
  } catch (e) {
    // Una inserción de gasto concurrente puede provocar violación de clave foránea.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      const count = await countCategoryExpenses(id).catch(() => 1);
      return { ok: false, error: blocking(Math.max(count, 1)) };
    }
    return unexpectedError("deleteCategory", e);
  }
}
