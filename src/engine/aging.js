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
