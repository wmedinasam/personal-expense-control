// Self-check de la validación de íconos de categoría (tipo y tamaño).
// Uso: node scripts/check-category-icon.mjs   (Node ≥ 22.18 importa .ts directamente)
import assert from "node:assert/strict";
import { ICON_MAX_BYTES, parseCategoryIcon } from "../app/categorias/shared.ts";

const dataUrl = (mime, bytes) => `data:${mime};base64,${Buffer.from(bytes, "latin1").toString("base64")}`;
const PNG = "\x89PNG\r\n\x1a\n";
const ok = (raw) => assert.equal(parseCategoryIcon(raw).ok, true, raw.slice(0, 60));
const bad = (raw) => assert.equal(parseCategoryIcon(raw).ok, false, raw.slice(0, 60));

assert.deepEqual(parseCategoryIcon("  "), { ok: true, icon: null });
ok("lucide:Utensils");
bad("lucide:NoExiste");

ok(dataUrl("image/png", PNG + "datos"));
ok(dataUrl("image/jpeg", "\xff\xd8\xff\xe0datos"));
ok(dataUrl("image/webp", "RIFF\0\0\0\0WEBPVP8 "));
ok(dataUrl("image/svg+xml", '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>'));

bad(dataUrl("image/gif", "GIF89a"));          // tipo no permitido
bad(dataUrl("text/html", "<svg>"));           // tipo no permitido
bad(dataUrl("image/png", "\xff\xd8\xff\xe0")); // contenido no coincide con el tipo
bad(dataUrl("image/svg+xml", "<html></html>"));
bad("data:image/png;base64,@@@");
bad("javascript:alert(1)");

ok(dataUrl("image/png", PNG + "a".repeat(ICON_MAX_BYTES - PNG.length)));  // justo 100 KB
bad(dataUrl("image/png", PNG + "a".repeat(ICON_MAX_BYTES - PNG.length + 1))); // 1 byte de más
bad(dataUrl("image/png", PNG + "a".repeat(ICON_MAX_BYTES * 3)));          // muy grande (corte rápido)

console.log("check-category-icon: OK");
