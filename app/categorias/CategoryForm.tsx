"use client";

import { useActionState, useEffect, useState } from "react";
import { createCategory, updateCategory } from "./actions";
import {
  CATEGORY_COLORS,
  DEFAULT_CATEGORY_COLOR,
  NAME_MAX_LENGTH,
} from "./shared";

type Props = {
  category?: { id: string; name: string; color: string };
  onCancel?: () => void;
  onSaved?: () => void;
};

export default function CategoryForm({ category, onCancel, onSaved }: Props) {
  const isEdit = Boolean(category);
  const action = isEdit ? updateCategory : createCategory;
  const [state, formAction, pending] = useActionState(action, null);

  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(category?.color ?? DEFAULT_CATEGORY_COLOR);

  useEffect(() => {
    if (!state?.ok) return;
    if (isEdit) {
      onSaved?.();
    } else {
      setName("");
      setColor(DEFAULT_CATEGORY_COLOR);
    }
    // Solo reaccionar a cada nuevo resultado de la acción.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const errorMessage = state && !state.ok ? state.error : null;
  const successMessage = state?.ok && !isEdit ? state.message : null;

  return (
    <form action={formAction} className="space-y-4">
      {category && <input type="hidden" name="id" value={category.id} />}

      <div>
        <label htmlFor={`name-${category?.id ?? "new"}`} className="block text-sm font-medium text-slate-700">
          Nombre
        </label>
        <input
          id={`name-${category?.id ?? "new"}`}
          name="name"
          type="text"
          required
          maxLength={NAME_MAX_LENGTH}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Por ejemplo, Alimentación"
          className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-slate-700">Color</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {CATEGORY_COLORS.map((c) => (
            <label key={c.hex} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={c.hex}
                checked={color === c.hex}
                onChange={() => setColor(c.hex)}
                aria-label={c.label}
                className="peer sr-only"
              />
              <span
                className="block h-7 w-7 rounded-full ring-offset-2 ring-offset-white ring-slate-900 peer-checked:ring-2 peer-focus-visible:ring-2"
                style={{ backgroundColor: c.hex }}
              />
            </label>
          ))}
        </div>
      </fieldset>

      {errorMessage && (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}
      {successMessage && (
        <p role="status" className="text-sm text-emerald-700">
          {successMessage}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear categoría"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
