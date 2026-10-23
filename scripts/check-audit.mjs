// node scripts/check-audit.mjs — self-check de lib/audit.ts (Node >= 22.6).
import assert from "node:assert/strict";
import { audit, toAuditJson } from "../lib/audit.ts";

assert.equal(toAuditJson(null), undefined);
assert.equal(toAuditJson(undefined), undefined);
const d = new Date("2026-10-23T00:00:00.000Z");
assert.deepEqual(toAuditJson({ date: d, n: 1 }), { date: "2026-10-23T00:00:00.000Z", n: 1 });
// Decimal de Prisma se serializa con toJSON -> string
assert.deepEqual(toAuditJson({ amount: { toJSON: () => "12.50" } }), { amount: "12.50" });
assert.deepEqual(toAuditJson({ icon: "data:image/png;base64,AAAA" }), { icon: "[imagen image/png]" });
assert.deepEqual(toAuditJson({ icon: "lucide:Car" }), { icon: "lucide:Car" });

let saved;
await audit({ auditLog: { create: async (args) => (saved = args) } }, {
  userId: "u1", action: "UPDATE", entity: "Expense", entityId: "e1", before: { a: 1 }, after: { a: 2 },
});
assert.deepEqual(saved.data, {
  userId: "u1", userEmail: null, action: "UPDATE", entity: "Expense", entityId: "e1", before: { a: 1 }, after: { a: 2 },
});
console.log("check-audit: OK");

// formatAuditStamp
import { formatAuditStamp } from "../lib/audit.ts";
const c = new Date("2026-10-23T20:05:00Z"); // 14:05 en Guatemala (UTC-6)
const ana = { name: "Ana", email: "ana@gmail.com" };
assert.equal(formatAuditStamp({ createdAt: c, createdBy: ana, updatedAt: c, updatedBy: ana }), "Creado por Ana el 23/10/2026 14:05");
assert.equal(
  formatAuditStamp({ createdAt: c, createdBy: null, updatedAt: new Date("2026-10-24T15:30:00Z"), updatedBy: { name: null, email: "luis@gmail.com" } }),
  "Creado por — el 23/10/2026 14:05 · Modificado por luis@gmail.com el 24/10/2026 09:30",
);
console.log("formatAuditStamp: OK");
