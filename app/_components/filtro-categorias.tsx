"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildDashboardHref, type Period } from "@/lib/reports";

export type CategoriaOpcion = { id: string; name: string; color: string };

/**
 * Selector de categorías (selección múltiple) del dashboard. El estado vive en
 * la URL (`cats=id1,id2`); al aplicar se navega a la nueva URL.
 * Sin `selectedIds` (lista vacía) se muestran todas las categorías.
 */
export function FiltroCategorias({
  categories,
  selectedIds,
  period,
  fecha,
}: {
  categories: CategoriaOpcion[];
  selectedIds: string[];
  period: Period;
  fecha: string;
}) {
  const router = useRouter();
  const allIds = categories.map((c) => c.id);
  const [checked, setChecked] = useState<string[]>(
    selectedIds.length === 0 ? allIds : selectedIds,
  );

  const allSelected = checked.length === allIds.length;
  const summary =
    selectedIds.length === 0
      ? "Todas las categorías"
      : `${selectedIds.length} de ${allIds.length} categorías`;

  function apply(next: string[]) {
    // Seleccionar todas equivale a no filtrar: la URL queda sin `cats`.
    const cats = next.length === allIds.length ? [] : next;
    router.push(buildDashboardHref(period, fecha, cats));
  }

  function toggle(id: string) {
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="filtro-categorias" className="flex flex-col gap-3 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="filtro-categorias" className="font-medium text-zinc-700">
          Categorías
        </h2>
        <span className="text-xs text-zinc-500">{summary}</span>
      </div>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Categorías a incluir en el dashboard</legend>
        {categories.map((c) => {
          const isOn = checked.includes(c.id);
          return (
            <label
              key={c.id}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 transition-colors ${
                isOn
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={isOn}
                onChange={() => toggle(c.id)}
              />
              <span
                aria-hidden
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              {c.name}
            </label>
          );
        })}
      </fieldset>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => apply(checked)}
          disabled={checked.length === 0}
          className="rounded-md bg-zinc-900 px-3 py-1.5 font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Aplicar
        </button>
        <button
          type="button"
          onClick={() => {
            setChecked(allIds);
            apply(allIds);
          }}
          disabled={allSelected && selectedIds.length === 0}
          className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Todas
        </button>
      </div>
    </section>
  );
}
