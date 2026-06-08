import { test } from "node:test";
import assert from "node:assert/strict";
import { CLUBS } from "../src/data/clubs.js";
import { SEASONS } from "../src/data/seasons.js";
import { SQUADS } from "../src/data/squads.js";
import { validateData } from "../src/data/validate.js";

test("data validates against schema", () => {
  const errors = validateData({ CLUBS, SEASONS, SQUADS });
  assert.deepEqual(errors, [], errors.join("\n"));
});

test("each season's final table length equals its division size", () => {
  for (const [year, s] of Object.entries(SEASONS)) {
    assert.equal(s.finalTable.length, s.divisionSize, `year ${year}`);
  }
});

test("draftable squads exist for the sample window", () => {
  assert.ok(SQUADS["LOG|1994"]?.length >= 11);
  assert.ok(SQUADS["ALB|1994"]?.length >= 11);
});

test("every squad can field a legal 4-4-2 (has >=1 GK and >=10 outfield)", () => {
  for (const [key, squad] of Object.entries(SQUADS)) {
    const gks = squad.filter(p => p.positions.includes("GK")).length;
    assert.ok(gks >= 1, `${key} has no GK`);
    assert.ok(squad.length - gks >= 10, `${key} lacks outfield players`);
  }
});
