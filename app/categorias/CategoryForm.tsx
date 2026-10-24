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
import { Button, FormError, Input, Label } from "@/app/_components/ui";

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
  const nameId = `name-${category?.id ?? "new"}`;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {category && <input type="hidden" name="id" value={category.id} />}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={nameId}>Nombre</Label>
        <Input
          id={nameId}
          name="name"
          type="text"
          required
          maxLength={NAME_MAX_LENGTH}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Por ejemplo, Alimentación"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-muted">Color</legend>
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
                className="block h-7 w-7 rounded-full ring-offset-2 ring-offset-background ring-foreground peer-checked:ring-2 peer-focus-visible:ring-2"
                style={{ backgroundColor: c.hex }}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-muted">Ícono</legend>
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
                  selected ? "border-foreground bg-surface-2" : "border-border hover:bg-surface-2"
                } focus:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
              >
                <Icon aria-hidden size={18} color={color} />
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border">
            <CategoryIcon icon={icon} color={color} size={20} />
          </span>
          <label className="cursor-pointer rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-border focus-within:ring-2 focus-within:ring-accent">
            Subir imagen
            <input type="file" accept={ICON_ACCEPT} onChange={handleFile} className="sr-only" />
          </label>
          {icon && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIcon("");
                setIconError(null);
              }}
            >
              Quitar ícono
            </Button>
          )}
          <span className="text-xs text-muted">PNG, JPG, WEBP o SVG, máx. 100 KB.</span>
        </div>
        {iconError && <FormError>{iconError}</FormError>}
      </fieldset>

      {errorMessage && <FormError>{errorMessage}</FormError>}
      {successMessage && (
        <p role="status" className="text-sm text-success">
          {successMessage}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear categoría"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
