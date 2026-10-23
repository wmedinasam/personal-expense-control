"use client";

import { useActionState, useRef, useState } from "react";
import { deleteCategory } from "./actions";
import CategoryForm from "./CategoryForm";
import CategoryIcon from "./CategoryIcon";
import type { CategoryListItem } from "./shared";

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
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{category.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{usage}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Editar
          </button>
          <form ref={formRef} action={deleteAction}>
            <input type="hidden" name="id" value={category.id} />
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                if (
                  window.confirm(`¿Borrar la categoría «${category.name}»? Esta acción no se puede deshacer.`)
                ) {
                  formRef.current?.requestSubmit();
                }
              }}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 disabled:opacity-60"
            >
              {deleting ? "Borrando…" : "Borrar"}
            </button>
          </form>
        </div>
      </div>

      {deleteState && !deleteState.ok && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {deleteState.error}
        </p>
      )}
    </li>
  );
}
