import { test } from "node:test";
import assert from "node:assert/strict";
import { FORMATION_442, positionFit, openSlots } from "../src/game/formation.js";

test("4-4-2 has 11 slots with unique ids", () => {
  assert.equal(FORMATION_442.length, 11);
  assert.equal(new Set(FORMATION_442.map(s => s.id)).size, 11);
});

test("exact position match scores 1", () => {
  assert.equal(positionFit(["ST"], "ST"), 1);
});

test("eligible-but-not-primary scores 0.8", () => {
  assert.equal(positionFit(["CF","ST"], "ST"), 1); // ST present -> full
  assert.equal(positionFit(["CF"], "ST"), 0.8);    // related, eligible
});

test("ineligible position scores low (0.4)", () => {
  assert.equal(positionFit(["GK"], "ST"), 0.4);
});

test("openSlots returns slots not present in filled ids", () => {
  const open = openSlots(["GK","ST1"]);
  assert.equal(open.length, 9);
  assert.ok(!open.some(s => s.id === "GK"));
});
