import { test } from "node:test";
import assert from "node:assert/strict";
import { createRng } from "../src/engine/rng.js";
import {
  projectedPoints, insertIntoTable, deriveRecord, simulateFiveYears,
} from "../src/engine/simulate.js";
import { SEASONS } from "../src/data/seasons.js";

const mkPlayer = (media, age, pos) => ({
  pos, age, velocidad: media, resistencia: media, agresividad: media, calidad: media, media,
});
const strongXI = Array.from({ length: 11 }, () => ({ slotId: "AT1", player: mkPlayer(95, 24, "AT") }));
const weakXI = Array.from({ length: 11 }, () => ({ slotId: "AT1", player: mkPlayer(55, 33, "AT") }));

test("stronger teams project more points", () => {
  const s = SEASONS[1995];
  assert.ok(projectedPoints(90, s) > projectedPoints(60, s));
});

test("insertIntoTable places a title-worthy points total at position 1", () => {
  const s = SEASONS[1995];
  const top = s.finalTable[0].pts;
  const { position, table } = insertIntoTable(s, top + 5, "ZZZ"); // ZZZ not a real club
  assert.equal(position, 1);
  assert.equal(table[0].isYou, true);
  assert.equal(table.length, s.divisionSize); // one real club drops out
});

test("you replace your own club's real row (table stays full)", () => {
  const s = SEASONS[1995];
  const realClub = s.finalTable[5].club; // some mid-table real club
  const { table } = insertIntoTable(s, 999, realClub);
  assert.equal(table.length, s.divisionSize);
  assert.equal(table.filter(r => r.club === realClub).length, 1); // only the you-row
  assert.equal(table[0].isYou, true);
});

test("derived record is internally consistent", () => {
  const r = deriveRecord(80, 38, 3, 85, createRng(1));
  assert.equal(r.P, 38);
  assert.equal(r.W + r.D + r.L, 38);
  assert.equal(r.W * 3 + r.D, 80); // 3pt season
});

test("five-year sim returns 5 ordered seasons", () => {
  const res = simulateFiveYears(strongXI, 1994, { SEASONS }, 7);
  assert.equal(res.length, 5);
  assert.deepEqual(res.map(r => r.year), [1994, 1995, 1996, 1997, 1998]);
  for (const r of res) {
    assert.ok(r.position >= 1);
    assert.ok(Array.isArray(r.topScorers));
  }
});

test("aging makes an old XI decline across the five years", () => {
  const res = simulateFiveYears(weakXI, 1994, { SEASONS }, 7);
  assert.ok(res[4].position >= res[0].position - 1);
});

test("simulation is deterministic for a fixed seed", () => {
  const a = simulateFiveYears(strongXI, 1994, { SEASONS }, 99);
  const b = simulateFiveYears(strongXI, 1994, { SEASONS }, 99);
  assert.deepEqual(a.map(r => r.position), b.map(r => r.position));
});
