// Self-check del parseo de `?cat=`. Ejecutar: node scripts/check-category-params.mjs
import assert from "node:assert/strict";
import { parseCategoryIds } from "../lib/reports.ts";

const valid = ["a", "b", "c"];
assert.deepEqual(parseCategoryIds(undefined, valid), []);
assert.deepEqual(parseCategoryIds("a", valid), ["a"]);
assert.deepEqual(parseCategoryIds(["b", "a", "b"], valid), ["b", "a"]);
assert.deepEqual(parseCategoryIds(["x", "a", "", "'; drop"], valid), ["a"]);
assert.deepEqual(parseCategoryIds(["x"], valid), []);
assert.deepEqual(parseCategoryIds("a", []), []);
console.log("ok: parseCategoryIds");
