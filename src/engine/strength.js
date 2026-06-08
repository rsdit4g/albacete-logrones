import { FORMATION_442, positionFit } from "../game/formation.js";

// A single player's rating from the v2 attributes:
//   80% Media + 10% average(Velocidad, Resistencia, Agresividad) + 10% Calidad
export function playerRating(p) {
  const vraAvg = (p.velocidad + p.resistencia + p.agresividad) / 3;
  return 0.8 * p.media + 0.1 * vraAvg + 0.1 * p.calidad;
}

// Aggregate picks into a 0..100-ish team strength: the average of each player's
// rating weighted by how well their bucket fits their assigned slot.
// `ratingOf` lets the caller substitute an aged rating (used by the simulator);
// it defaults to the player's current rating.
export function teamStrength(picks, ratingOf = (pick) => playerRating(pick.player)) {
  if (!picks.length) return 0;
  let total = 0;
  for (const pick of picks) {
    const slot = FORMATION_442.find(s => s.id === pick.slotId);
    const slotPos = slot ? slot.pos : pick.player.pos;
    total += ratingOf(pick) * positionFit(pick.player.pos, slotPos);
  }
  return total / picks.length;
}
