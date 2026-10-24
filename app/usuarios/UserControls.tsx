"use client";

import { useActionState, useId } from "react";
import { changeUser, preauthorizeUser } from "./actions";
import { Button, Input, Label, Select } from "@/app/_components/ui";

export function UserButton({ id, op, label, danger }: { id: string; op: string; label: string; danger?: boolean }) {
  const [state, action, pending] = useActionState(changeUser, null);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value={op} />
      <Button type="submit" disabled={pending} variant={danger ? "danger" : "secondary"}>
        {pending ? "…" : label}
      </Button>
      {state && !state.ok && (
        <p role="alert" className="mt-1 max-w-56 text-xs text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function PreauthorizeForm() {
  const [state, action, pending] = useActionState(preauthorizeUser, null);
  const emailId = useId();
  const roleId = useId();
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-56 flex-1 flex-col gap-1">
        <Label htmlFor={emailId}>Correo de Google</Label>
        <Input id={emailId} type="email" name="email" required placeholder="nombre@gmail.com" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={roleId}>Rol</Label>
        <Select id={roleId} name="role">
          <option value="MEMBER">Miembro</option>
          <option value="ADMIN">Administrador</option>
        </Select>
      </div>
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Guardando…" : "Pre-autorizar"}
      </Button>
      {state && (
        <p role={state.ok ? "status" : "alert"} className={`w-full text-sm ${state.ok ? "text-success" : "text-danger"}`}>
          {state.ok ? state.message : state.error}
        </p>
      )}
    </form>
  );
}
