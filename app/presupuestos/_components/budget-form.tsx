"use client";

import { useActionState } from "react";
import { createBudget, updateBudget } from "../actions";
import type { Currency } from "@prisma/client";
import type { BudgetFormState, RawBudgetInput } from "@/lib/budgets";
import { CURRENCY_LABEL } from "@/lib/currency";
import CategoryIcon from "@/app/categorias/CategoryIcon";
import { Button, ButtonLink, Card, FormError, Input, Label, Select } from "@/app/_components/ui";

export type FormCategory = { id: string; name: string; color: string; icon: string | null };

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
    <Card>
      <form action={formAction} className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">
          {budget ? "Editar presupuesto" : "Nuevo presupuesto"}
        </h2>

        {budget && <input type="hidden" name="id" value={budget.id} />}

        {state.error && <FormError>{state.error}</FormError>}

        <div className="space-y-1">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            maxLength={80}
            placeholder="Ej.: Comida de noviembre"
            defaultValue={values?.name ?? budget?.name ?? ""}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="amount">Monto</Label>
          <Input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            required
            placeholder="0.00"
            defaultValue={values?.amount ?? budget?.amount ?? ""}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="currency">Moneda</Label>
          <Select
            id="currency"
            name="currency"
            defaultValue={values?.currency ?? budget?.currency ?? defaultCurrency}
          >
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {CURRENCY_LABEL[currency]}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="startDate">Inicio</Label>
            <Input
              id="startDate"
              name="startDate"
              type="text"
              inputMode="numeric"
              required
              placeholder="dd/mm/aaaa"
              pattern="\d{1,2}/\d{1,2}/\d{4}"
              title="Fecha en formato dd/mm/aaaa"
              defaultValue={values?.startDate ?? budget?.startDate ?? ""}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endDate">Fin</Label>
            <Input
              id="endDate"
              name="endDate"
              type="text"
              inputMode="numeric"
              required
              placeholder="dd/mm/aaaa"
              pattern="\d{1,2}/\d{1,2}/\d{4}"
              title="Fecha en formato dd/mm/aaaa"
              defaultValue={values?.endDate ?? budget?.endDate ?? ""}
            />
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-muted">Categorías</legend>
          <p className="text-xs text-muted">
            Sin categorías seleccionadas, el presupuesto aplica a todos los gastos.
          </p>
          {categories.length === 0 ? (
            <p className="text-sm text-muted">No hay categorías creadas.</p>
          ) : (
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-2 rounded px-1 py-1 text-sm text-foreground hover:bg-surface-2"
                >
                  <input
                    type="checkbox"
                    name="categoryIds"
                    value={category.id}
                    defaultChecked={selectedCategories.includes(category.id)}
                    className="h-4 w-4 rounded border-border accent-accent"
                  />
                  <CategoryIcon icon={category.icon} color={category.color} />
                  {category.name}
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <div className="flex items-center justify-end gap-3 pt-2">
          {budget && <ButtonLink href="/presupuestos" variant="ghost">Cancelar</ButtonLink>}
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Guardando…" : budget ? "Guardar cambios" : "Crear presupuesto"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
