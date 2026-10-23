"use client";

import { deleteBudget } from "../actions";

export function DeleteBudgetButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteBudget}
      onSubmit={(event) => {
        if (!window.confirm(`¿Eliminar el presupuesto "${name}"?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:underline"
      >
        Eliminar
      </button>
    </form>
  );
}
