import { test } from "node:test";
import assert from "node:assert/strict";
import { FORMATION_442, positionFit, openSlots, openByPosition } from "../src/game/formation.js";

test("4-4-2 has 11 slots: 1 GK, 4 DF, 4 MF, 2 AT", () => {
  assert.equal(FORMATION_442.length, 11);
  assert.deepEqual(openByPosition([]), { GK: 1, DF: 4, MF: 4, AT: 2 });
});

test("slot ids are unique", () => {
  assert.equal(new Set(FORMATION_442.map(s => s.id)).size, 11);
});

test("exact bucket match scores 1", () => {
  assert.equal(positionFit("AT", "AT"), 1);
  assert.equal(positionFit("GK", "GK"), 1);
});

test("adjacent outfield buckets score 0.6", () => {
  assert.equal(positionFit("MF", "DF"), 0.6);
  assert.equal(positionFit("AT", "MF"), 0.6);
  assert.equal(positionFit("DF", "MF"), 0.6);
});

test("non-adjacent and keeper mismatches score 0.3", () => {
  assert.equal(positionFit("DF", "AT"), 0.3);
  assert.equal(positionFit("GK", "DF"), 0.3);
  assert.equal(positionFit("AT", "GK"), 0.3);
});

test("openSlots excludes filled ids", () => {
  const open = openSlots(["GK", "AT1"]);
  assert.equal(open.length, 9);
  assert.ok(!open.some(s => s.id === "GK"));
});
