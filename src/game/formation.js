// 4-4-2. x/y are percentages on the pitch (y: 0=top/attack, 100=own goal).
export const FORMATION_442 = [
  { id: "GK",  role: "GK",  x: 50, y: 92, eligible: ["GK"] },
  { id: "RB",  role: "RB",  x: 82, y: 70, eligible: ["RB","RWB"] },
  { id: "CB1", role: "CB",  x: 60, y: 74, eligible: ["CB"] },
  { id: "CB2", role: "CB",  x: 40, y: 74, eligible: ["CB"] },
  { id: "LB",  role: "LB",  x: 18, y: 70, eligible: ["LB","LWB"] },
  { id: "RM",  role: "RM",  x: 82, y: 44, eligible: ["RM","RW"] },
  { id: "CM1", role: "CM",  x: 60, y: 48, eligible: ["CM","CDM","CAM"] },
  { id: "CM2", role: "CM",  x: 40, y: 48, eligible: ["CM","CDM","CAM"] },
  { id: "LM",  role: "LM",  x: 18, y: 44, eligible: ["LM","LW"] },
  { id: "ST1", role: "ST",  x: 60, y: 16, eligible: ["ST","CF"] },
  { id: "ST2", role: "ST",  x: 40, y: 16, eligible: ["ST","CF"] },
];

// Fit of a player (their listed positions) in a slot role.
// 1.0  exact role match
// 0.8  role's eligible alternatives (e.g. CF in ST slot)
// 0.4  ineligible (out of position)
export function positionFit(playerPositions, slotRole) {
  const slot = FORMATION_442.find(s => s.role === slotRole) ||
               FORMATION_442.find(s => s.eligible.includes(slotRole));
  const eligible = slot ? slot.eligible : [slotRole];
  if (playerPositions.includes(slotRole)) return 1;
  if (playerPositions.some(p => eligible.includes(p))) return 0.8;
  return 0.4;
}

export function openSlots(filledIds) {
  return FORMATION_442.filter(s => !filledIds.includes(s.id));
}
