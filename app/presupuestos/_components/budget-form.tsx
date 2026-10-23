"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createBudget, updateBudget } from "../actions";
import type { Currency } from "@prisma/client";
import type { BudgetFormState, RawBudgetInput } from "@/lib/budgets";
import { CURRENCY_LABEL } from "@/lib/currency";

export type FormCategory = { id: string; name: string; color: string };

export type FormBudget = {
  id: string;
  name: string;
  amount: string;
  currency: Currency;
  startDate: string;
  endDate: string;
  categoryIds: string[];
};

const initialState: BudgetFormState = { error: null };

const inputClass =
  "w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-slate-500 dark:focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:focus:ring-slate-400";

const currencies = Object.keys(CURRENCY_LABEL) as Currency[];

export function BudgetForm({
  categories,
  budget,
  defaultCurrency,
}: {
  categories: FormCategory[];
  budget?: FormBudget;
  /** Moneda por defecto de la configuración; se preselecciona en presupuestos nuevos. */
  defaultCurrency: Currency;
}) {
  const action = budget ? updateBudget : createBudget;
  const [state, formAction, pending] = useActionState(action, initialState);

  // Tras un error se reutilizan los valores enviados, porque React limpia el formulario al terminar la acción.
  const values: Partial<RawBudgetInput> | undefined = state.values;
  const selectedCategories = values
    ? values.categoryIds ?? []
    : budget?.categoryIds ?? [];

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-900 p-5"
    >
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {budget ? "Editar presupuesto" : "Nuevo presupuesto"}
      </h2>

      {budget && <input type="hidden" name="id" value={budget.id} />}

      {state.error && (
        <p
          role="alert"
          className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300"
        >
          {state.error}
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={80}
          placeholder="Ej.: Comida de noviembre"
          defaultValue={values?.name ?? budget?.name ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="amount" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Monto
        </label>
        <input
          id="amount"
          name="amount"
          type="text"
          inputMode="decimal"
          required
          placeholder="0.00"
          defaultValue={values?.amount ?? budget?.amount ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="currency" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Moneda
        </label>
        <select
          id="currency"
          name="currency"
          defaultValue={values?.currency ?? budget?.currency ?? defaultCurrency}
          className={inputClass}
        >
          {currencies.map((currency) => (
            <option key={currency} value={currency}>
              {CURRENCY_LABEL[currency]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="startDate" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Inicio
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={values?.startDate ?? budget?.startDate ?? ""}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="endDate" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Fin
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            defaultValue={values?.endDate ?? budget?.endDate ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">Categorías</legend>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Sin categorías seleccionadas, el presupuesto aplica a todos los gastos.
        </p>
        {categories.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No hay categorías creadas.</p>
        ) : (
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-slate-200 dark:border-slate-800 p-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 rounded px-1 py-1 text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={category.id}
                  defaultChecked={selectedCategories.includes(category.id)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
                />
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="flex items-center justify-end gap-3 pt-2">
        {budget && (
          <Link
            href="/presupuestos"
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:underline"
          >
            Cancelar
          </Link>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-neutral-950 hover:bg-slate-700 dark:hover:bg-slate-300 disabled:opacity-60"
        >
          {pending ? "Guardando…" : budget ? "Guardar cambios" : "Crear presupuesto"}
        </button>
      </div>
    </form>
  );
}
