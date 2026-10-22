import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ExpenseField = "amount" | "date" | "categoryId" | "description";

export type FieldErrors = Partial<Record<ExpenseField, string>>;

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

export type ExpenseData = {
  amount: Prisma.Decimal;
  date: Date;
  categoryId: string;
  description: string | null;
};

export type ExpenseFilters = {
  from?: Date;
  to?: Date;
  categoryId?: string;
};

const AMOUNT_RE = /^\d{1,10}(\.\d{1,2})?$/; // Decimal(12, 2): hasta 10 enteros y 2 decimales
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MAX_DESCRIPTION_LENGTH = 200;

/** Convierte "YYYY-MM-DD" en Date a medianoche UTC; null si no es una fecha real. */
export function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const match = DATE_RE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

/** Valida los campos de un gasto (formulario) y comprueba que la categoría exista. */
export async function validateExpenseInput(
  raw: Record<string, string>,
): Promise<
  | { ok: true; data: ExpenseData }
  | { ok: false; fieldErrors: FieldErrors }
> {
  const fieldErrors: FieldErrors = {};

  let amount: Prisma.Decimal | undefined;
  const amountText = (raw.amount ?? "").trim().replace(",", ".");
  if (!AMOUNT_RE.test(amountText)) {
    fieldErrors.amount =
      "Introduce un importe válido, con hasta 2 decimales (ej. 12,50).";
  } else {
    amount = new Prisma.Decimal(amountText);
    if (amount.lte(0)) {
      amount = undefined;
      fieldErrors.amount = "El importe debe ser mayor que 0.";
    }
  }

  const date = parseDate((raw.date ?? "").trim());
  if (!date) {
    fieldErrors.date = "Introduce una fecha válida.";
  }

  const categoryId = (raw.categoryId ?? "").trim();
  if (!categoryId) {
    fieldErrors.categoryId = "Selecciona una categoría.";
  } else {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      fieldErrors.categoryId = "La categoría seleccionada no existe.";
    }
  }

  const description = (raw.description ?? "").trim();
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    fieldErrors.description = `La descripción no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres.`;
  }

  if (Object.keys(fieldErrors).length > 0 || !amount || !date) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    data: {
      amount,
      date,
      categoryId,
      description: description || null,
    },
  };
}

export function parseFilters(raw: {
  from?: string;
  to?: string;
  categoryId?: string;
}): ExpenseFilters {
  return {
    from: parseDate(raw.from) ?? undefined,
    to: parseDate(raw.to) ?? undefined,
    categoryId: raw.categoryId || undefined,
  };
}

function buildWhere(filters: ExpenseFilters): Prisma.ExpenseWhereInput {
  return {
    ...(filters.from || filters.to
      ? { date: { gte: filters.from, lte: filters.to } }
      : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
  };
}

export function createExpense(data: ExpenseData) {
  return prisma.expense.create({ data });
}

export function updateExpense(id: string, data: ExpenseData) {
  return prisma.expense.update({ where: { id }, data });
}

export function deleteExpense(id: string) {
  return prisma.expense.delete({ where: { id } });
}

export function getExpense(id: string) {
  return prisma.expense.findUnique({ where: { id } });
}

export function listExpenses(filters: ExpenseFilters) {
  return prisma.expense.findMany({
    where: buildWhere(filters),
    include: { category: { select: { name: true, color: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}

export async function sumExpenses(filters: ExpenseFilters) {
  const result = await prisma.expense.aggregate({
    where: buildWhere(filters),
    _sum: { amount: true },
    _count: { _all: true },
  });
  return {
    total: result._sum.amount ?? new Prisma.Decimal(0),
    count: result._count._all,
  };
}

/** Formato español con dos decimales, p. ej. 1.234,50. Sin símbolo de moneda. */
export function formatAmount(value: Prisma.Decimal | string): string {
  const [integer, decimals = "00"] = new Prisma.Decimal(value)
    .toFixed(2)
    .split(".");
  return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${decimals}`;
}

/** Fecha para mostrar: dd/mm/aaaa. */
export function formatDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

/** Fecha para inputs type="date": YYYY-MM-DD. */
export function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}
