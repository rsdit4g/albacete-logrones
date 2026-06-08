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
  assert.ok(SQUADS["FC Barcelona|1994"]?.length >= 11);
  assert.ok(SQUADS["CD Logroñés|1994"]?.length >= 11);
});

test("every squad's club really played in that season's league", () => {
  for (const key of Object.keys(SQUADS)) {
    const [club, year] = key.split("|");
    const season = SEASONS[year];
    assert.ok(season, `no season data for ${year}`);
    assert.ok(season.finalTable.some(r => r.club === club),
      `${club} not in the ${year} league table`);
  }
});

test("every squad can field a legal 4-4-2 (1 GK, 4 DF, 4 MF, 2 AT)", () => {
  for (const [key, squad] of Object.entries(SQUADS)) {
    const count = (pos) => squad.filter(p => p.pos === pos).length;
    assert.ok(count("GK") >= 1, `${key} has no GK`);
    assert.ok(count("DF") >= 4, `${key} lacks 4 DF`);
    assert.ok(count("MF") >= 4, `${key} lacks 4 MF`);
    assert.ok(count("AT") >= 2, `${key} lacks 2 AT`);
  }
});
