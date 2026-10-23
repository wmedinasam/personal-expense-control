import { Currency, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  computeBudgetConsumption,
  type BudgetConsumption,
} from "@/lib/budget-consumption";

const MAX_AMOUNT = 9_999_999_999.99; // Decimal(12, 2)
const MAX_NAME_LENGTH = 80;

/** Valores tal como los escribe el usuario en el formulario. */
export type RawBudgetInput = {
  name: string;
  amount: string;
  currency: string;
  startDate: string;
  endDate: string;
  categoryIds: string[];
};

export type BudgetFormState = {
  error: string | null;
  values?: RawBudgetInput;
};

export type ValidBudgetInput = {
  name: string;
  amount: number;
  currency: Currency;
  startDate: Date;
  endDate: Date;
  categoryIds: string[];
};

export type BudgetView = {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  startDate: Date;
  endDate: Date;
  categoryIds: string[];
  categoryNames: string[];
  consumption: BudgetConsumption;
};

export type CategoryOption = {
  id: string;
  name: string;
  color: string;
};

/** Fecha de hoy como medianoche UTC, según el calendario del servidor. */
export function todayUtcDate(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/** Convierte "YYYY-MM-DD" a Date UTC; null si no es una fecha real. */
function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10) === value ? date : null;
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function readRawBudgetInput(formData: FormData): RawBudgetInput {
  return {
    name: String(formData.get("name") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    categoryIds: formData
      .getAll("categoryIds")
      .map((value) => String(value))
      .filter((value) => value.length > 0),
  };
}

/**
 * Valida la entrada del formulario. Comprueba además que las categorías
 * existan. Devuelve el error en español o los datos ya normalizados.
 */
export async function validateBudgetInput(
  raw: RawBudgetInput,
): Promise<{ ok: true; data: ValidBudgetInput } | { ok: false; error: string }> {
  const name = raw.name.trim();
  if (name.length === 0) {
    return { ok: false, error: "El nombre es obligatorio." };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      error: `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres.`,
    };
  }

  const amountText = raw.amount.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(amountText)) {
    return {
      ok: false,
      error: "El monto debe ser un número con hasta 2 decimales.",
    };
  }
  const amount = Number(amountText);
  if (!(amount > 0)) {
    return { ok: false, error: "El monto debe ser mayor que cero." };
  }
  if (amount > MAX_AMOUNT) {
    return { ok: false, error: "El monto es demasiado grande." };
  }

  if (!Object.values(Currency).includes(raw.currency as Currency)) {
    return { ok: false, error: "La moneda no es válida." };
  }

  const startDate = parseIsoDate(raw.startDate);
  if (!startDate) {
    return { ok: false, error: "La fecha de inicio no es válida." };
  }
  const endDate = parseIsoDate(raw.endDate);
  if (!endDate) {
    return { ok: false, error: "La fecha de fin no es válida." };
  }
  if (endDate.getTime() < startDate.getTime()) {
    return {
      ok: false,
      error: "La fecha de fin no puede ser anterior a la de inicio.",
    };
  }

  const categoryIds = [...new Set(raw.categoryIds)];
  if (categoryIds.length > 0) {
    const found = await prisma.category.count({
      where: { id: { in: categoryIds } },
    });
    if (found !== categoryIds.length) {
      return {
        ok: false,
        error: "Alguna de las categorías seleccionadas ya no existe.",
      };
    }
  }

  return {
    ok: true,
    data: {
      name,
      amount,
      currency: raw.currency as Currency,
      startDate,
      endDate,
      categoryIds,
    },
  };
}

export async function listCategories(): Promise<CategoryOption[]> {
  return prisma.category.findMany({
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Lista los presupuestos con su consumo calculado al momento de la consulta.
 * Hace una sola consulta de gastos que cubre el rango de todos los presupuestos.
 * `usdToGtq` es el tipo de cambio de la configuración (quetzales por dólar).
 */
export async function listBudgetViews(
  today: Date,
  usdToGtq: Prisma.Decimal,
): Promise<BudgetView[]> {
  const budgets = await prisma.budget.findMany({
    include: { categories: { select: { id: true, name: true } } },
    orderBy: [{ startDate: "desc" }, { name: "asc" }],
  });
  if (budgets.length === 0) return [];

  const rangeStart = new Date(
    Math.min(...budgets.map((b) => b.startDate.getTime())),
  );
  const rangeEnd = new Date(Math.max(...budgets.map((b) => b.endDate.getTime())));

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: rangeStart, lte: rangeEnd } },
    select: { amount: true, currency: true, date: true, categoryId: true },
  });
  const expenseItems = expenses.map((e) => ({
    amount: e.amount.toNumber(),
    currency: e.currency,
    date: e.date,
    categoryId: e.categoryId,
  }));

  return budgets.map((budget) => {
    const amount = budget.amount.toNumber();
    return {
      id: budget.id,
      name: budget.name,
      amount,
      currency: budget.currency,
      startDate: budget.startDate,
      endDate: budget.endDate,
      categoryIds: budget.categories.map((c) => c.id),
      categoryNames: budget.categories.map((c) => c.name),
      consumption: computeBudgetConsumption(
        {
          amount,
          currency: budget.currency,
          startDate: budget.startDate,
          endDate: budget.endDate,
          categoryIds: budget.categories.map((c) => c.id),
        },
        expenseItems,
        today,
        usdToGtq,
      ),
    };
  });
}

export async function getBudgetById(id: string) {
  return prisma.budget.findUnique({
    where: { id },
    include: { categories: { select: { id: true } } },
  });
}
