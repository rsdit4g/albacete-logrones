import { FORMATION_442, openSlots, positionFit } from "./formation.js";
import { randInt } from "../engine/rng.js";

export function createDraft(rng) {
  return { rng, picks: [], draftedKeys: new Set() };
}

function filledIds(draft) {
  return draft.picks.map(p => p.slotId);
}

// Pick a random [club, year] from the combo pool.
export function spin(draft, combos) {
  const [club, year] = combos[randInt(draft.rng, 0, combos.length - 1)];
  return { club, year };
}

// Players from this squad eligible for at least one currently-open slot,
// excluding already-drafted players. Sorted best-fit then overall.
export function availableForOpenSlots(draft, SQUADS, club, year) {
  const squad = SQUADS[`${club}|${year}`] || [];
  const open = openSlots(filledIds(draft));
  const openRoles = new Set(open.map(s => s.role));
  return squad
    .filter(pl => !draft.draftedKeys.has(playerKey(club, year, pl)))
    .map(pl => {
      const bestFit = Math.max(...[...openRoles].map(r => positionFit(pl.positions, r)));
      return { player: pl, bestFit };
    })
    .filter(x => x.bestFit > 0.4) // only show players that fit an open slot reasonably
    .sort((a, b) => b.bestFit - a.bestFit || b.player.overall - a.player.overall)
    .map(x => x.player);
}

function playerKey(club, year, player) {
  return `${club}|${year}|${player.name}`;
}

// Draft a player into a specific open slot. Returns a new draft state.
export function draftPlayer(draft, { club, year, player }, slotId) {
  const slot = FORMATION_442.find(s => s.id === slotId);
  if (!slot) throw new Error(`unknown slot ${slotId}`);
  if (filledIds(draft).includes(slotId)) throw new Error(`slot ${slotId} already filled`);
  const key = playerKey(club, year, player);
  if (draft.draftedKeys.has(key)) throw new Error(`player already drafted: ${key}`);
  const picks = [...draft.picks, { slotId, club, year, player }];
  const draftedKeys = new Set(draft.draftedKeys);
  draftedKeys.add(key);
  return { ...draft, picks, draftedKeys };
}

export function isComplete(draft) {
  return draft.picks.length === FORMATION_442.length;
}

// Picks in engine-ready shape (already are: {slotId, club, year, player}).
export function currentXI(draft) {
  return draft.picks;
}
