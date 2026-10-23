"use client";

import { useState, useTransition } from "react";
import { borrarGasto } from "./actions";

export default function DeleteExpenseButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!window.confirm("¿Borrar este gasto? Esta acción no se puede deshacer.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await borrarGasto(id);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
      >
        {pending ? "Borrando…" : "Borrar"}
      </button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </>
  );
}
