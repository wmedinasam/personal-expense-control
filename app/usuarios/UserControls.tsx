"use client";

import { useActionState } from "react";
import { changeUser, preauthorizeUser } from "./actions";

const BTN = "rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-60";

export function UserButton({ id, op, label, danger }: { id: string; op: string; label: string; danger?: boolean }) {
  const [state, action, pending] = useActionState(changeUser, null);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value={op} />
      <button
        type="submit"
        disabled={pending}
        className={`${BTN} ${danger ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
      >
        {pending ? "…" : label}
      </button>
      {state && !state.ok && (
        <p role="alert" className="mt-1 max-w-56 text-xs text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function PreauthorizeForm() {
  const [state, action, pending] = useActionState(preauthorizeUser, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="flex min-w-56 flex-1 flex-col gap-1 text-sm">
        <span className="text-slate-600 dark:text-slate-400">Correo de Google</span>
        <input
          type="email"
          name="email"
          required
          placeholder="nombre@gmail.com"
          className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-600 dark:text-slate-400">Rol</span>
        <select name="role" className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100">
          <option value="MEMBER">Miembro</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </label>
      <button type="submit" disabled={pending} className={`${BTN} bg-slate-900 dark:bg-slate-100 py-2 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-white`}>
        {pending ? "Guardando…" : "Pre-autorizar"}
      </button>
      {state && (
        <p role={state.ok ? "status" : "alert"} className={`w-full text-sm ${state.ok ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {state.ok ? state.message : state.error}
        </p>
      )}
    </form>
  );
}
