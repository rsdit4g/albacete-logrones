import { test } from "node:test";
import assert from "node:assert/strict";
import { COMBOS, YEAR_RANGE } from "../src/data/combos.js";
import { SQUADS } from "../src/data/squads.js";

test("every combo has a non-empty squad", () => {
  for (const [club, year] of COMBOS) {
    assert.ok(SQUADS[`${club}|${year}`]?.length >= 11, `${club}|${year}`);
  }
});

test("year range spans the design window bounds", () => {
  assert.equal(YEAR_RANGE.min, 1980);
  assert.equal(YEAR_RANGE.max, 2025);
});
