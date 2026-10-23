// node scripts/check-audit-view.mjs — self-check de lib/audit-view.ts (Node >= 22.6).
import assert from "node:assert/strict";
import { diffAudit, formatAt, formatValue, parseDmy, summarize } from "../lib/audit-view.ts";

// UPDATE: solo lo que cambió (incluye campos agregados o quitados y valores anidados)
assert.deepEqual(
  diffAudit(
    { name: "Comida", color: "#111", icon: null, tags: [1], gone: 1 },
    { name: "Comida", color: "#222", icon: null, tags: [1, 2], added: "x" },
  ),
  [
    { field: "color", before: "#111", after: "#222" },
    { field: "tags", before: [1], after: [1, 2] },
    { field: "gone", before: 1, after: undefined },
    { field: "added", before: undefined, after: "x" },
  ],
);
assert.deepEqual(diffAudit({ a: 1 }, { a: 1 }), []);
// CREATE / DELETE: todos los campos
assert.deepEqual(diffAudit(null, { a: 1, b: null }), [
  { field: "a", before: undefined, after: 1 },
  { field: "b", before: undefined, after: null },
]);
assert.deepEqual(diffAudit({ a: 1 }, undefined), [{ field: "a", before: 1, after: undefined }]);
assert.deepEqual(diffAudit(null, null), []);
assert.deepEqual(diffAudit("raro", [1]), []);

assert.equal(formatValue(undefined), "—");
assert.equal(formatValue(null), "—");
assert.equal(formatValue("<b>x</b>"), "<b>x</b>"); // React lo escapa al renderizar
assert.equal(formatValue({ a: 1 }), '{"a":1}');
assert.equal(formatValue(false), "false");

assert.equal(summarize(null, { name: "Comida" }), "Comida");
assert.equal(summarize({ amount: "12.50", currency: "GTQ", description: "Pan" }, null), "12.50 GTQ · Pan");
assert.equal(summarize(null, { defaultCurrency: "GTQ", usdToGtq: "7.75" }), "GTQ · USD→GTQ 7.75");
assert.equal(summarize(null, null, "x@gmail.com"), "x@gmail.com");
assert.equal(summarize(null, null), "—");

// 01/02/2026 en Guatemala = 06:00 UTC
assert.equal(parseDmy("01/02/2026").toISOString(), "2026-02-01T06:00:00.000Z");
assert.equal(parseDmy("1/2/2026", true).toISOString(), "2026-02-02T06:00:00.000Z");
assert.equal(parseDmy("31/12/2026", true).toISOString(), "2027-01-01T06:00:00.000Z");
assert.equal(parseDmy("29/02/2028").toISOString(), "2028-02-29T06:00:00.000Z");
for (const bad of ["29/02/2026", "32/01/2026", "00/01/2026", "01/13/2026", "2026-01-01", "", "1/1/26", "aa/bb/cccc"]) {
  assert.equal(parseDmy(bad), null, bad);
}

assert.equal(formatAt(new Date("2026-10-23T20:05:00Z")), "23/10/2026 14:05");
assert.equal(formatAt(new Date("2026-01-01T05:59:00Z")), "31/12/2025 23:59");
console.log("check-audit-view: OK");

// updatedAt no cuenta como cambio en un UPDATE
assert.deepEqual(
  diffAudit({ name: "A", updatedAt: "2026-10-23T00:00:00Z" }, { name: "B", updatedAt: "2026-10-24T00:00:00Z" }),
  [{ field: "name", before: "A", after: "B" }],
);
console.log("updatedAt ignorado: OK");
