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
        className="text-sm text-muted hover:text-danger hover:underline"
      >
        Eliminar
      </button>
    </form>
  );
}
