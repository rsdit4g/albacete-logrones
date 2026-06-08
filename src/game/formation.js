// 4-4-2 with simplified position buckets: GK / DF / MF / AT.
// x/y are percentages on the pitch (y: 0 = attack/top, 100 = own goal).
export const FORMATION_442 = [
  { id: "GK",  pos: "GK", x: 50, y: 92 },
  { id: "DF1", pos: "DF", x: 83, y: 72 },
  { id: "DF2", pos: "DF", x: 61, y: 76 },
  { id: "DF3", pos: "DF", x: 39, y: 76 },
  { id: "DF4", pos: "DF", x: 17, y: 72 },
  { id: "MF1", pos: "MF", x: 83, y: 46 },
  { id: "MF2", pos: "MF", x: 61, y: 50 },
  { id: "MF3", pos: "MF", x: 39, y: 50 },
  { id: "MF4", pos: "MF", x: 17, y: 46 },
  { id: "AT1", pos: "AT", x: 61, y: 18 },
  { id: "AT2", pos: "AT", x: 39, y: 18 },
];

// Landscape layout (wider than tall): attack on left (x≈22%), GK on right (x≈90%).
// Same slot IDs as FORMATION_442 so picks match correctly.
export const FORMATION_442_LANDSCAPE = [
  { id: "GK",  pos: "GK", x: 90, y: 50 },
  { id: "DF1", pos: "DF", x: 74, y: 16 },
  { id: "DF2", pos: "DF", x: 74, y: 38 },
  { id: "DF3", pos: "DF", x: 74, y: 62 },
  { id: "DF4", pos: "DF", x: 74, y: 84 },
  { id: "MF1", pos: "MF", x: 52, y: 16 },
  { id: "MF2", pos: "MF", x: 52, y: 38 },
  { id: "MF3", pos: "MF", x: 52, y: 62 },
  { id: "MF4", pos: "MF", x: 52, y: 84 },
  { id: "AT1", pos: "AT", x: 22, y: 36 },
  { id: "AT2", pos: "AT", x: 22, y: 64 },
];

export const POSITIONS = ["GK", "DF", "MF", "AT"];

// Fit of a player's bucket in a slot's bucket.
// 1.0 exact bucket; 0.6 adjacent outfield line (DF↔MF, MF↔AT); 0.3 otherwise
// (e.g. an outfielder in goal, or a keeper outfield).
export function positionFit(playerPos, slotPos) {
  if (playerPos === slotPos) return 1;
  const adjacent = { DF: ["MF"], MF: ["DF", "AT"], AT: ["MF"] };
  if (adjacent[slotPos] && adjacent[slotPos].includes(playerPos)) return 0.6;
  return 0.3;
}

export function openSlots(filledIds) {
  return FORMATION_442.filter(s => !filledIds.includes(s.id));
}

// Count of open slots per position bucket — used to drive draft eligibility.
export function openByPosition(filledIds) {
  const counts = { GK: 0, DF: 0, MF: 0, AT: 0 };
  for (const s of openSlots(filledIds)) counts[s.pos]++;
  return counts;
}
