"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Button, ButtonLink, Input, Label, Select } from "@/app/_components/ui";
import { CURRENCY_LABEL } from "@/lib/currency";
import type { ActionResult } from "@/lib/expenses";
import { crearGasto, editarGasto } from "./actions";

const CURRENCIES = ["GTQ", "USD"] as const;
type Currency = (typeof CURRENCIES)[number];

type Props = {
  categories: { id: string; name: string }[];
  defaultCurrency: Currency;
  defaultDate: string;
  cancelHref: string;
  expense?: {
    id: string;
    amount: string;
    currency: Currency;
    date: string;
    categoryId: string;
    description: string;
  };
};

const invalidClass = "aria-[invalid=true]:border-danger";

export default function ExpenseForm({
  categories,
  defaultCurrency,
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
      <div className="flex flex-col gap-1">
        <Label htmlFor="amount">Importe</Label>
        <Input
          id="amount"
          name="amount"
          inputMode="decimal"
          placeholder="0,00"
          defaultValue={expense?.amount}
          aria-invalid={Boolean(fieldErrors.amount)}
          aria-describedby={fieldErrors.amount ? "amount-error" : undefined}
          className={invalidClass}
        />
        {fieldErrors.amount && (
          <p id="amount-error" className="text-xs text-danger">
            {fieldErrors.amount}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="currency">Moneda</Label>
        <Select
          id="currency"
          name="currency"
          defaultValue={expense?.currency ?? defaultCurrency}
          aria-invalid={Boolean(fieldErrors.currency)}
          aria-describedby={
            fieldErrors.currency ? "currency-error" : undefined
          }
          className={invalidClass}
        >
          {CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {CURRENCY_LABEL[currency]}
            </option>
          ))}
        </Select>
        {fieldErrors.currency && (
          <p id="currency-error" className="text-xs text-danger">
            {fieldErrors.currency}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="date">Fecha</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={expense?.date ?? defaultDate}
          aria-invalid={Boolean(fieldErrors.date)}
          aria-describedby={fieldErrors.date ? "date-error" : undefined}
          className={invalidClass}
        />
        {fieldErrors.date && (
          <p id="date-error" className="text-xs text-danger">
            {fieldErrors.date}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="categoryId">Categoría</Label>
        <Select
          id="categoryId"
          name="categoryId"
          defaultValue={expense?.categoryId ?? ""}
          aria-invalid={Boolean(fieldErrors.categoryId)}
          aria-describedby={
            fieldErrors.categoryId ? "category-error" : undefined
          }
          className={invalidClass}
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        {categories.length === 0 && (
          <p className="text-xs text-muted">
            No hay categorías disponibles.
          </p>
        )}
        {fieldErrors.categoryId && (
          <p id="category-error" className="text-xs text-danger">
            {fieldErrors.categoryId}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="description">
          Descripción <span className="font-normal text-muted">(opcional)</span>
        </Label>
        <Input
          id="description"
          name="description"
          maxLength={200}
          defaultValue={expense?.description}
          aria-invalid={Boolean(fieldErrors.description)}
          aria-describedby={
            fieldErrors.description ? "description-error" : undefined
          }
          className={invalidClass}
        />
        {fieldErrors.description && (
          <p id="description-error" className="text-xs text-danger">
            {fieldErrors.description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Añadir gasto"}
        </Button>
        {isEdit && (
          <ButtonLink href={cancelHref} variant="ghost">
            Cancelar edición
          </ButtonLink>
        )}
        {result && (
          <p
            role="status"
            className={`text-sm ${result.ok ? "text-success" : "text-danger"}`}
          >
            {result.message}
          </p>
        )}
      </div>
    </form>
  );
}
