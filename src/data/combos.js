import { SQUADS } from "./squads.js?v=32";

// Draftable [club, year] pairs derived from whatever squads exist.
export const COMBOS = Object.keys(SQUADS).map(k => {
  const [club, year] = k.split("|");
  return [club, Number(year)];
});

// The start-year selector range from the design spec (1980–2025),
// independent of which squads are populated.
export const YEAR_RANGE = { min: 1980, max: 2025 };
