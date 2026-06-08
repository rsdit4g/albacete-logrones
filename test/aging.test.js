import { test } from "node:test";
import assert from "node:assert/strict";
import { projectedOverall } from "../src/engine/aging.js";

test("no change at year 0", () => {
  assert.equal(projectedOverall(80, 27, 0), 80);
});

test("a young player improves slightly over a couple of years", () => {
  assert.ok(projectedOverall(75, 21, 2) > 75);
});

test("a player in their 30s declines over five years", () => {
  assert.ok(projectedOverall(85, 31, 5) < 85);
});

test("overall is clamped to [40,99]", () => {
  assert.ok(projectedOverall(99, 19, 3) <= 99);
  assert.ok(projectedOverall(45, 38, 5) >= 40);
});
