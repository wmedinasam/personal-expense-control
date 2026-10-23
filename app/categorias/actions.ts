"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
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
  const user = await requireUser();
  const parsed = await validateCategoryFields(readFields(formData));
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    const created = await prisma.$transaction(async (tx) => {
      const after = await tx.category.create({
        data: { ...parsed.data, createdById: user.id, updatedById: user.id },
      });
      await audit(tx, { userId: user.id, action: "CREATE", entity: "Category", entityId: after.id, after });
      return after;
    });
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
  const user = await requireUser();
  const id = readId(formData);
  if (!id) return { ok: false, error: "Falta el identificador de la categoría." };

  const existing = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, error: "La categoría ya no existe." };

  const parsed = await validateCategoryFields(readFields(formData), id);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const before = await tx.category.findUnique({ where: { id } });
      if (!before) return null; // borrada entre la validación y la escritura
      const after = await tx.category.update({
        where: { id },
        data: { ...parsed.data, updatedById: user.id },
      });
      await audit(tx, { userId: user.id, action: "UPDATE", entity: "Category", entityId: id, before, after });
      return after;
    });
    if (!updated) return { ok: false, error: "La categoría ya no existe." };
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
  const user = await requireUser();
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

    const deleted = await prisma.$transaction(async (tx) => {
      const before = await tx.category.findUnique({ where: { id } });
      if (!before) return false;
      await tx.category.delete({ where: { id } });
      await audit(tx, { userId: user.id, action: "DELETE", entity: "Category", entityId: id, before });
      return true;
    });
    if (!deleted) return { ok: false, error: "La categoría ya no existe." };
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
