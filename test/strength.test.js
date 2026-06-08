import { test } from "node:test";
import assert from "node:assert/strict";
import { teamStrength } from "../src/engine/strength.js";

const xi = (ovr) => Array.from({ length: 11 }, (_, i) => ({
  slotId: "GK", // role irrelevant here; fit forced via positions
  player: { overall: ovr, positions: ["GK"] },
}));

test("strength scales with overall ratings", () => {
  const weak = teamStrength(xi(60));
  const strong = teamStrength(xi(90));
  assert.ok(strong > weak);
});

test("strength of an all-90 perfectly-fit XI is ~90", () => {
  const s = teamStrength(xi(90));
  assert.ok(Math.abs(s - 90) < 1, `got ${s}`);
});

test("out-of-position players lower strength", () => {
  const fit = teamStrength([{ slotId: "ST1", player: { overall: 90, positions: ["ST"] } }]);
  const unfit = teamStrength([{ slotId: "ST1", player: { overall: 90, positions: ["GK"] } }]);
  assert.ok(unfit < fit);
});
