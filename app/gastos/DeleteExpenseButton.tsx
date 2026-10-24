"use client";

import { useState, useTransition } from "react";
import { Button } from "@/app/_components/ui";
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
      <Button type="button" variant="danger" onClick={handleClick} disabled={pending}>
        {pending ? "Borrando…" : "Borrar"}
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </>
  );
}
