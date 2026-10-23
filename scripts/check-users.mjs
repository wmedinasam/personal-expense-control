// node scripts/check-users.mjs — self-check de las reglas de lib/users.ts (Node >= 22.6).
import assert from "node:assert/strict";
import { normalizeEmail, userChangeError } from "../lib/users.ts";

const admin = { id: "a", role: "ADMIN", status: "ACTIVE" };
const member = { id: "m", role: "MEMBER", status: "ACTIVE" };
const base = { actorId: "a", targetIsAdminEmail: false, activeAdminCount: 2 };
const ok = (input) => assert.equal(userChangeError({ ...base, ...input }), null);
const no = (input, re) => assert.match(userChangeError({ ...base, ...input }) ?? "", re);

// A sí mismo: no puede degradarse ni desactivarse.
no({ target: admin, change: { role: "MEMBER" } }, /ti mismo/);
no({ target: admin, change: { status: "DISABLED" } }, /ti mismo/);
ok({ target: admin, change: { role: "ADMIN" } });

// ADMIN_EMAIL protegido.
const root = { id: "r", role: "ADMIN", status: "ACTIVE" };
no({ target: root, targetIsAdminEmail: true, change: { role: "MEMBER" } }, /ADMIN_EMAIL/);
no({ target: root, targetIsAdminEmail: true, change: { status: "DISABLED" } }, /ADMIN_EMAIL/);

// Último admin activo.
const other = { id: "o", role: "ADMIN", status: "ACTIVE" };
no({ target: other, activeAdminCount: 1, change: { role: "MEMBER" } }, /al menos un administrador/);
no({ target: other, activeAdminCount: 1, change: { status: "DISABLED" } }, /al menos un administrador/);
ok({ target: other, activeAdminCount: 2, change: { role: "MEMBER" } });
// Un admin desactivado no cuenta: degradarlo no deja al sistema sin admins.
ok({ target: { ...other, status: "DISABLED" }, activeAdminCount: 1, change: { role: "MEMBER" } });

// Miembros: cambios normales.
ok({ target: member, change: { role: "ADMIN" } });
ok({ target: member, change: { status: "DISABLED" } });
ok({ target: { ...member, status: "PENDING" }, change: { status: "ACTIVE" } });

// Correos.
assert.equal(normalizeEmail("  Ana@Gmail.COM "), "ana@gmail.com");
assert.equal(normalizeEmail("ana@gmail"), null);
assert.equal(normalizeEmail("ana gmail.com"), null);
assert.equal(normalizeEmail(""), null);

console.log("check-users: OK");
