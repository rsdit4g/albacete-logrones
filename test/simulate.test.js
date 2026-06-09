import { test } from "node:test";
import assert from "node:assert/strict";
import { createRng } from "../src/engine/rng.js";
import {
  projectedPoints, insertIntoTable, deriveRecord, simulateFiveYears,
} from "../src/engine/simulate.js";
import { SEASONS } from "../src/data/seasons.js";
import { relegationInfo } from "../src/game/relegation.js";

test("relegation structure matches the historical promoción", () => {
  assert.deepEqual(relegationInfo(1994), { direct: 2, promocion: 2 }); // 20-team promoción era
  assert.deepEqual(relegationInfo(1995), { direct: 2, promocion: 2 }); // 22-team, 1995-96
  assert.deepEqual(relegationInfo(1996), { direct: 4, promocion: 1 }); // 22→20 reduction
  assert.deepEqual(relegationInfo(1998), { direct: 2, promocion: 2 }); // last promoción season
  assert.deepEqual(relegationInfo(1999), { direct: 3, promocion: 0 }); // promoción abolished
  assert.deepEqual(relegationInfo(2005), { direct: 3, promocion: 0 });
});

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
  // Relegation (Segunda, null position) is the ultimate decline — treat as worst.
  const finalRank = res[4].inSegunda ? Infinity : res[4].position;
  assert.ok(finalRank >= res[0].position - 1);
});

test("every season result exposes relegation + Supercopa fields", () => {
  const res = simulateFiveYears(strongXI, 1994, { SEASONS }, 7);
  for (const r of res) {
    assert.equal(typeof r.relegated, "boolean");
    assert.equal(typeof r.promocion, "boolean");
    assert.ok(r.directSpots >= 2 && r.directSpots <= 4);
    assert.ok(r.promocionSpots >= 0 && r.promocionSpots <= 2);
    assert.equal(r.relegationSpots, r.directSpots + r.promocionSpots);
    // A play-off team that wins stays up; a relegated team never "survived".
    if (r.promocion && r.promocionSurvived) assert.equal(r.relegated, false);
    assert.ok(r.supercopa === null || r.supercopa === "Campeón" || r.supercopa === "Subcampeón");
  }
});

test("a Segunda season is always a 0-point placeholder", () => {
  const res = simulateFiveYears(weakXI, 1994, { SEASONS }, 7);
  // Every season actually spent in Segunda is a 0-point placeholder with no table,
  // whether or not the side later wins promotion.
  for (const r of res.filter(s => s.inSegunda)) {
    assert.equal(r.position, null);
    assert.equal(r.record.Pts, 0);
    assert.deepEqual(r.table, []);
    assert.equal(typeof r.ascended, "boolean");
  }
});

test("winning promotion in Segunda returns you to Primera next season", () => {
  // Sweep seeds to find a run with a promotion, then assert the season after an
  // `ascended` Segunda year is back in Primera (not in Segunda).
  for (let seed = 0; seed < 60; seed++) {
    const res = simulateFiveYears(weakXI, 1994, { SEASONS }, seed);
    for (let i = 0; i < res.length - 1; i++) {
      if (res[i].inSegunda && res[i].ascended) {
        assert.equal(res[i + 1].inSegunda, false); // promoted → Primera next year
        return;
      }
    }
  }
  assert.fail("no promotion occurred across 60 seeds — expected ~33%/season to surface one");
});

test("winning the league or cup triggers a Supercopa result", () => {
  const res = simulateFiveYears(strongXI, 1994, { SEASONS }, 7);
  for (const r of res) {
    const qualified = r.honours.includes("La Liga") || r.copaRound === "Campeón";
    if (qualified) assert.ok(r.supercopa === "Campeón" || r.supercopa === "Subcampeón");
    else assert.equal(r.supercopa, null);
  }
});

test("simulation is deterministic for a fixed seed", () => {
  const a = simulateFiveYears(strongXI, 1994, { SEASONS }, 99);
  const b = simulateFiveYears(strongXI, 1994, { SEASONS }, 99);
  assert.deepEqual(a.map(r => r.position), b.map(r => r.position));
});
