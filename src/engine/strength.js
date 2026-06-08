import { FORMATION_442, positionFit } from "../game/formation.js";

// Team strength = average of (player overall * position fit) across the XI.
// Returns a 0..100-ish scalar. A full XI of 90-rated players in their best
// positions returns ~90.
export function teamStrength(picks) {
  if (!picks.length) return 0;
  let total = 0;
  for (const pick of picks) {
    const slot = FORMATION_442.find(s => s.id === pick.slotId);
    const role = slot ? slot.role : pick.player.positions[0];
    total += pick.player.overall * positionFit(pick.player.positions, role);
  }
  return total / picks.length;
}
