"use client";

import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import { createCategory, updateCategory } from "./actions";
import CategoryIcon, { LUCIDE_ICONS } from "./CategoryIcon";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  DEFAULT_CATEGORY_COLOR,
  ICON_ACCEPT,
  ICON_MAX_BYTES,
  LUCIDE_PREFIX,
  NAME_MAX_LENGTH,
  parseCategoryIcon,
} from "./shared";

type Props = {
  category?: { id: string; name: string; color: string; icon: string | null };
  onCancel?: () => void;
  onSaved?: () => void;
};

export default function CategoryForm({ category, onCancel, onSaved }: Props) {
  const isEdit = Boolean(category);
  const action = isEdit ? updateCategory : createCategory;
  const [state, formAction, pending] = useActionState(action, null);

  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(category?.color ?? DEFAULT_CATEGORY_COLOR);
  const [icon, setIcon] = useState(category?.icon ?? "");
  const [iconError, setIconError] = useState<string | null>(null);

  // Aviso inmediato en el cliente; el servidor vuelve a validar al guardar.
  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (!ICON_ACCEPT.split(",").includes(file.type)) {
      setIconError("La imagen debe ser PNG, JPG, WEBP o SVG.");
      return;
    }
    if (file.size > ICON_MAX_BYTES) {
      setIconError("La imagen no puede pesar más de 100 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCategoryIcon(String(reader.result));
      if (parsed.ok) {
        setIcon(parsed.icon ?? "");
        setIconError(null);
      } else {
        setIconError(parsed.error);
      }
    };
    reader.onerror = () => setIconError("No se pudo leer la imagen.");
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (!state?.ok) return;
    if (isEdit) {
      onSaved?.();
    } else {
      setName("");
      setColor(DEFAULT_CATEGORY_COLOR);
      setIcon("");
      setIconError(null);
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
        <label htmlFor={`name-${category?.id ?? "new"}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
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
          className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-slate-500 dark:focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:focus:ring-slate-400"
        />
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">Color</legend>
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
                className="block h-7 w-7 rounded-full ring-offset-2 ring-offset-white ring-slate-900 dark:ring-slate-100 peer-checked:ring-2 peer-focus-visible:ring-2"
                style={{ backgroundColor: c.hex }}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">Ícono</legend>
        <input type="hidden" name="icon" value={icon} />
        <div className="mt-2 grid grid-cols-8 gap-2 sm:grid-cols-12">
          {CATEGORY_ICONS.map(({ name: iconName, label }) => {
            const value = `${LUCIDE_PREFIX}${iconName}`;
            const Icon = LUCIDE_ICONS[iconName];
            const selected = icon === value;
            return (
              <button
                key={iconName}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={selected}
                onClick={() => {
                  setIcon(value);
                  setIconError(null);
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-md border ${
                  selected
                    ? "border-slate-900 dark:border-slate-100 bg-slate-100 dark:bg-slate-800"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                } focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:focus-visible:ring-slate-400`}
              >
                <Icon aria-hidden size={18} color={color} />
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 dark:border-slate-800">
            <CategoryIcon icon={icon} color={color} size={20} />
          </span>
          <label className="cursor-pointer rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus-within:ring-2 focus-within:ring-slate-500 dark:focus-within:ring-slate-400">
            Subir imagen
            <input type="file" accept={ICON_ACCEPT} onChange={handleFile} className="sr-only" />
          </label>
          {icon && (
            <button
              type="button"
              onClick={() => {
                setIcon("");
                setIconError(null);
              }}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Quitar ícono
            </button>
          )}
          <span className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG, WEBP o SVG, máx. 100 KB.</span>
        </div>
        {iconError && (
          <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
            {iconError}
          </p>
        )}
      </fieldset>

      {errorMessage && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}
      {successMessage && (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
          {successMessage}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center rounded-md bg-slate-900 dark:bg-slate-100 px-3 py-2 text-sm font-medium text-white dark:text-neutral-950 shadow-sm hover:bg-slate-700 dark:hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear categoría"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
