"use client";

import { useActionState, useRef, useState } from "react";
import { deleteCategory } from "./actions";
import CategoryForm from "./CategoryForm";
import CategoryIcon from "./CategoryIcon";
import type { CategoryListItem } from "./shared";
import { AuditStamp } from "@/app/_components/AuditStamp";
import { Button, FormError } from "@/app/_components/ui";

export default function CategoryRow({ category }: { category: CategoryListItem }) {
  const [editing, setEditing] = useState(false);
  const [deleteState, deleteAction, deleting] = useActionState(deleteCategory, null);
  const formRef = useRef<HTMLFormElement>(null);

  if (editing) {
    return (
      <li className="py-4">
        <CategoryForm
          category={{ id: category.id, name: category.name, color: category.color, icon: category.icon }}
          onSaved={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  const usage =
    category.expenseCount === 0
      ? "Sin gastos"
      : `${category.expenseCount} gasto${category.expenseCount === 1 ? "" : "s"}`;

  return (
    <li className="py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <CategoryIcon icon={category.icon} color={category.color} size={20} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{category.name}</p>
            <p className="text-xs text-muted">{usage}</p>
            <AuditStamp record={category} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="ghost" onClick={() => setEditing(true)}>
            Editar
          </Button>
          <form ref={formRef} action={deleteAction}>
            <input type="hidden" name="id" value={category.id} />
            <Button
              type="button"
              variant="danger"
              disabled={deleting}
              onClick={() => {
                if (
                  window.confirm(`¿Borrar la categoría «${category.name}»? Esta acción no se puede deshacer.`)
                ) {
                  formRef.current?.requestSubmit();
                }
              }}
            >
              {deleting ? "Borrando…" : "Borrar"}
            </Button>
          </form>
        </div>
      </div>

      {deleteState && !deleteState.ok && <FormError>{deleteState.error}</FormError>}
    </li>
  );
}
