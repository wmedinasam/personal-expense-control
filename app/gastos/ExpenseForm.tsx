"use client";

import Link from "next/link";
import { useRef, useState, useTransition, type FormEvent } from "react";
import type { ActionResult } from "@/lib/expenses";
import { crearGasto, editarGasto } from "./actions";

type Props = {
  categories: { id: string; name: string }[];
  defaultDate: string;
  cancelHref: string;
  expense?: {
    id: string;
    amount: string;
    date: string;
    categoryId: string;
    description: string;
  };
};

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 aria-[invalid=true]:border-red-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-100 dark:focus:ring-neutral-100";

const labelClass = "mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300";

export default function ExpenseForm({
  categories,
  defaultDate,
  cancelHref,
  expense,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = expense !== undefined;
  const fieldErrors = result && !result.ok ? (result.fieldErrors ?? {}) : {};

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const response = expense
        ? await editarGasto(expense.id, formData)
        : await crearGasto(formData);
      setResult(response);
      if (response.ok && !isEdit) formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-4 sm:grid-cols-2"
    >
      <div>
        <label htmlFor="amount" className={labelClass}>
          Importe
        </label>
        <input
          id="amount"
          name="amount"
          inputMode="decimal"
          placeholder="0,00"
          defaultValue={expense?.amount}
          aria-invalid={Boolean(fieldErrors.amount)}
          aria-describedby={fieldErrors.amount ? "amount-error" : undefined}
          className={inputClass}
        />
        {fieldErrors.amount && (
          <p id="amount-error" className="mt-1 text-xs text-red-600">
            {fieldErrors.amount}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="date" className={labelClass}>
          Fecha
        </label>
        <input
          id="date"
          name="date"
          type="date"
          defaultValue={expense?.date ?? defaultDate}
          aria-invalid={Boolean(fieldErrors.date)}
          aria-describedby={fieldErrors.date ? "date-error" : undefined}
          className={inputClass}
        />
        {fieldErrors.date && (
          <p id="date-error" className="mt-1 text-xs text-red-600">
            {fieldErrors.date}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="categoryId" className={labelClass}>
          Categoría
        </label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={expense?.categoryId ?? ""}
          aria-invalid={Boolean(fieldErrors.categoryId)}
          aria-describedby={
            fieldErrors.categoryId ? "category-error" : undefined
          }
          className={inputClass}
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {categories.length === 0 && (
          <p className="mt-1 text-xs text-neutral-500">
            No hay categorías disponibles.
          </p>
        )}
        {fieldErrors.categoryId && (
          <p id="category-error" className="mt-1 text-xs text-red-600">
            {fieldErrors.categoryId}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Descripción <span className="font-normal text-neutral-500">(opcional)</span>
        </label>
        <input
          id="description"
          name="description"
          maxLength={200}
          defaultValue={expense?.description}
          aria-invalid={Boolean(fieldErrors.description)}
          aria-describedby={
            fieldErrors.description ? "description-error" : undefined
          }
          className={inputClass}
        />
        {fieldErrors.description && (
          <p id="description-error" className="mt-1 text-xs text-red-600">
            {fieldErrors.description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Añadir gasto"}
        </button>
        {isEdit && (
          <Link
            href={cancelHref}
            className="text-sm text-neutral-600 hover:underline dark:text-neutral-400"
          >
            Cancelar edición
          </Link>
        )}
        {result && (
          <p
            role="status"
            className={`text-sm ${result.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
          >
            {result.message}
          </p>
        )}
      </div>
    </form>
  );
}
