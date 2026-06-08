import { test } from "node:test";
import assert from "node:assert/strict";
import { createRng } from "../src/engine/rng.js";
import {
  createDraft, spin, availableForOpenSlots, draftPlayer, isComplete, currentXI,
} from "../src/game/draft.js";
import { SQUADS } from "../src/data/squads.js";

const combos = [["LOG", 1994], ["ALB", 1994], ["LOG", 1995], ["ALB", 1995]];

test("a fresh draft has 11 open slots and is not complete", () => {
  const d = createDraft(createRng(1));
  assert.equal(d.picks.length, 0);
  assert.equal(isComplete(d), false);
});

test("spin returns a club+year from the combo pool", () => {
  const d = createDraft(createRng(1));
  const { club, year } = spin(d, combos);
  assert.ok(combos.some(([c, y]) => c === club && y === year));
});

test("availableForOpenSlots only lists players eligible for an open slot", () => {
  const d = createDraft(createRng(1));
  const list = availableForOpenSlots(d, SQUADS, "LOG", 1994);
  assert.ok(list.length > 0);
});

test("drafting a player fills a slot and removes that slot from open", () => {
  const d = createDraft(createRng(1));
  const gk = SQUADS["LOG|1994"].find(p => p.positions.includes("GK"));
  const d2 = draftPlayer(d, { club: "LOG", year: 1994, player: gk }, "GK");
  assert.equal(d2.picks.length, 1);
  assert.equal(d2.picks[0].slotId, "GK");
});

test("cannot draft the same player twice", () => {
  const d = createDraft(createRng(1));
  const gk = SQUADS["LOG|1994"].find(p => p.positions.includes("GK"));
  const d2 = draftPlayer(d, { club: "LOG", year: 1994, player: gk }, "GK");
  assert.throws(() => draftPlayer(d2, { club: "LOG", year: 1994, player: gk }, "GK"));
});

test("currentXI returns picks usable by the engine", () => {
  const d = createDraft(createRng(1));
  const gk = SQUADS["LOG|1994"].find(p => p.positions.includes("GK"));
  const d2 = draftPlayer(d, { club: "LOG", year: 1994, player: gk }, "GK");
  const xi = currentXI(d2);
  assert.equal(xi[0].slotId, "GK");
  assert.equal(xi[0].player.name, gk.name);
});
