const VALID_POS = new Set(["GK", "DF", "MF", "AT"]);
const ATTRS = ["velocidad", "resistencia", "agresividad", "calidad", "media"];

export function validateData({ CLUBS, SEASONS, SQUADS }) {
  const errors = [];
  const clubCodes = new Set(Object.keys(CLUBS));

  for (const [year, s] of Object.entries(SEASONS)) {
    if (!Number.isInteger(s.divisionSize)) errors.push(`season ${year}: divisionSize`);
    if (![2, 3].includes(s.pointsForWin)) errors.push(`season ${year}: pointsForWin must be 2 or 3`);
    if (!Array.isArray(s.finalTable)) errors.push(`season ${year}: finalTable`);
    for (const row of s.finalTable || []) {
      if (!clubCodes.has(row.club)) errors.push(`season ${year}: unknown club ${row.club}`);
      if (typeof row.pts !== "number") errors.push(`season ${year}: pts for ${row.club}`);
    }
    for (const sc of s.topScorers || []) {
      if (typeof sc.goals !== "number" || !sc.name) errors.push(`season ${year}: bad top scorer`);
    }
  }

  for (const [key, squad] of Object.entries(SQUADS)) {
    const [club, year] = key.split("|");
    if (!clubCodes.has(club)) errors.push(`squad ${key}: unknown club`);
    if (!SEASONS[year]) errors.push(`squad ${key}: unknown year`);
    for (const p of squad) {
      if (!p.name) errors.push(`squad ${key}: player missing name`);
      if (!VALID_POS.has(p.pos)) errors.push(`squad ${key}: bad pos for ${p.name}`);
      for (const a of ATTRS) {
        if (typeof p[a] !== "number") errors.push(`squad ${key}: ${a} for ${p.name}`);
      }
      if (typeof p.age !== "number") errors.push(`squad ${key}: age for ${p.name}`);
    }
  }
  return errors;
}
