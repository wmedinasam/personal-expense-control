"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createCategory, updateCategory } from "./actions";
import { CATEGORY_ICON_LABELS, CATEGORY_ICON_COMPONENTS, checkIconFileInBrowser } from "./icons";
import {
  CATEGORY_COLORS,
  CATEGORY_ICON_NAMES,
  DEFAULT_CATEGORY_COLOR,
  ICON_ACCEPT_ATTR,
  NAME_MAX_LENGTH,
} from "./shared";

type Props = {
  category?: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
    iconData: string | null;
  };
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
  const [iconData, setIconData] = useState(category?.iconData ?? "");
  const [iconError, setIconError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state?.ok) return;
    if (isEdit) {
      onSaved?.();
    } else {
      setName("");
      setColor(DEFAULT_CATEGORY_COLOR);
      setIcon("");
      setIconData("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    // Solo reaccionar a cada nuevo resultado de la acción.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function selectPredefinedIcon(next: string) {
    setIcon(next);
    // Elegir un icono predefinido quita el personalizado.
    setIconData("");
    setIconError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setIconError(null);
    if (!file) return;

    const problem = checkIconFileInBrowser(file);
    if (problem) {
      setIconError(problem);
      e.target.value = "";
      return;
    }

    setReading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setReading(false);
      setIconData(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => {
      setReading(false);
      setIconError("No se pudo leer el archivo. Inténtalo de nuevo.");
    };
    reader.readAsDataURL(file);
  }

  function removeCustomIcon() {
    setIconData("");
    setIconError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const errorMessage = iconError ?? (state && !state.ok ? state.error : null);
  const successMessage = state?.ok && !isEdit ? state.message : null;
  const idSuffix = category?.id ?? "new";

  return (
    <form action={formAction} className="space-y-4">
      {category && <input type="hidden" name="id" value={category.id} />}
      <input type="hidden" name="icon" value={icon} />
      <input type="hidden" name="iconData" value={iconData} />

      <div>
        <label htmlFor={`name-${idSuffix}`} className="block text-sm font-medium text-slate-700">
          Nombre
        </label>
        <input
          id={`name-${idSuffix}`}
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

      <fieldset>
        <legend className="block text-sm font-medium text-slate-700">Icono</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <label className="cursor-pointer">
            <input
              type="radio"
              name={`icon-${idSuffix}`}
              value=""
              checked={icon === ""}
              onChange={() => selectPredefinedIcon("")}
              aria-label="Sin icono"
              className="peer sr-only"
            />
            <span className="flex h-9 items-center rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-600 peer-checked:border-slate-900 peer-checked:ring-1 peer-checked:ring-slate-900 peer-focus-visible:ring-2">
              Ninguno
            </span>
          </label>
          {CATEGORY_ICON_NAMES.map((iconName) => {
            const Icon = CATEGORY_ICON_COMPONENTS[iconName];
            return (
              <label key={iconName} className="cursor-pointer">
                <input
                  type="radio"
                  name={`icon-${idSuffix}`}
                  value={iconName}
                  checked={icon === iconName}
                  onChange={() => selectPredefinedIcon(iconName)}
                  aria-label={CATEGORY_ICON_LABELS[iconName]}
                  title={CATEGORY_ICON_LABELS[iconName]}
                  className="peer sr-only"
                />
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 peer-checked:border-slate-900 peer-checked:ring-1 peer-checked:ring-slate-900 peer-focus-visible:ring-2">
                  <Icon aria-hidden className="h-5 w-5" />
                </span>
              </label>
            );
          })}
        </div>

        <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-white p-3">
          <p className="text-sm font-medium text-slate-700">Icono personalizado</p>
          <p className="mt-0.5 text-xs text-slate-500">
            PNG, JPG, SVG o WEBP, máximo 100 KB. Si lo subes, reemplaza al icono predefinido.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {iconData && (
              // eslint-disable-next-line @next/next/no-img-element -- vista previa de data URL
              <img src={iconData} alt="Vista previa del icono personalizado" className="h-9 w-9 rounded-md border border-slate-200 object-contain p-1" />
            )}
            <input
              ref={fileInputRef}
              id={`icon-file-${idSuffix}`}
              type="file"
              accept={ICON_ACCEPT_ATTR}
              onChange={handleFileChange}
              disabled={reading}
              className="block w-full max-w-xs text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-60"
            />
            {iconData && (
              <button
                type="button"
                onClick={removeCustomIcon}
                className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Quitar icono personalizado
              </button>
            )}
          </div>
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
          disabled={pending || reading}
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
