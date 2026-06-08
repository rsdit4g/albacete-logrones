import { test } from "node:test";
import assert from "node:assert/strict";
import { playerRating, teamStrength } from "../src/engine/strength.js";

const uniform = (n) => ({ velocidad: n, resistencia: n, agresividad: n, calidad: n, media: n });

test("playerRating of uniform attributes equals that value", () => {
  assert.equal(playerRating(uniform(80)), 80);
});

test("playerRating weights media at 80%", () => {
  // media 90, others 50: 0.8*90 + 0.1*50 + 0.1*50 = 72 + 5 + 5 = 82
  const r = playerRating({ velocidad: 50, resistencia: 50, agresividad: 50, calidad: 50, media: 90 });
  assert.equal(r, 82);
});

const xi = (n) => Array.from({ length: 11 }, () => ({ slotId: "GK", player: { ...uniform(n), pos: "GK" } }));

test("teamStrength scales with ratings", () => {
  assert.ok(teamStrength(xi(90)) > teamStrength(xi(60)));
});

test("perfectly-fit uniform XI strength equals the rating", () => {
  assert.ok(Math.abs(teamStrength(xi(90)) - 90) < 1);
});

test("out-of-position lowers strength", () => {
  const fit = teamStrength([{ slotId: "AT1", player: { ...uniform(90), pos: "AT" } }]);
  const unfit = teamStrength([{ slotId: "AT1", player: { ...uniform(90), pos: "GK" } }]);
  assert.ok(unfit < fit);
});
