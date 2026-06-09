// Per-year overall delta based on the age the player will be that year.
// Peak ~24-28. Young players gain, older players decline; effect grows with age.
// The decline side is intentionally gentle so an aging XI fades gradually rather
// than falling off a cliff in the final season.
function yearlyDelta(age) {
  if (age <= 20) return 1.5;
  if (age <= 23) return 1.0;
  if (age <= 28) return 0;      // peak plateau
  if (age <= 31) return -1.0;
  if (age <= 34) return -2.0;
  return -3.0;
}

// Project a player's overall `yearsLater` seasons from now, given current age.
export function projectedOverall(baseOverall, baseAge, yearsLater) {
  let ovr = baseOverall;
  for (let y = 1; y <= yearsLater; y++) {
    ovr += yearlyDelta(baseAge + y);
  }
  return Math.max(40, Math.min(99, Math.round(ovr)));
}

// A player's projected Media `yearsLater` seasons from the draft. This is the
// single source of truth shared by the draft UI (the per-season projection it
// shows) and the simulator (the rating it uses), so what you see when picking
// is exactly what the player is worth in each of the following seasons.
export function projectedMedia(player, yearsLater) {
  return projectedOverall(player.media, player.age, yearsLater);
}

// The five-season Media trajectory for a player if drafted now: index 0 is the
// first season (no aging) through index 4 (four years on).
export function mediaTrajectory(player) {
  return [0, 1, 2, 3, 4].map(y => projectedMedia(player, y));
}
