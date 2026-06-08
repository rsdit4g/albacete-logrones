const VALID_POS = new Set([
  "GK","RB","LB","CB","RWB","LWB","CDM","CM","CAM","RM","LM","RW","LW","CF","ST"
]);

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
      if (!Array.isArray(p.positions) || p.positions.some(x => !VALID_POS.has(x)))
        errors.push(`squad ${key}: bad positions for ${p.name}`);
      if (typeof p.overall !== "number") errors.push(`squad ${key}: overall for ${p.name}`);
      if (typeof p.age !== "number") errors.push(`squad ${key}: age for ${p.name}`);
    }
  }
  return errors;
}
