import { test } from "node:test";
import assert from "node:assert/strict";
import { createRng } from "../src/engine/rng.js";

test("same seed produces same sequence", () => {
  const a = createRng(42), b = createRng(42);
  assert.equal(a(), b());
  assert.equal(a(), b());
});

test("values are in [0,1)", () => {
  const r = createRng(1);
  for (let i = 0; i < 100; i++) {
    const v = r();
    assert.ok(v >= 0 && v < 1, `out of range: ${v}`);
  }
});

test("different seeds diverge", () => {
  assert.notEqual(createRng(1)(), createRng(2)());
});
