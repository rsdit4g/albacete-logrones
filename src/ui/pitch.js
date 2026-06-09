import { FORMATION_442 } from "../game/formation.js";
import { CLUBS } from "../data/clubs.js";

// Shared 4-4-2 pitch markup, reused by the draft screen and the results screen.
// FIFA standard dimensions: 68m wide × 105m tall → viewBox="0 0 68 105".
export const PITCH_SVG = `<svg viewBox="0 0 68 105" preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
    style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0.45">
  <!-- Halfway line -->
  <line x1="0" y1="52.5" x2="68" y2="52.5" stroke="white" stroke-width="0.7"/>
  <!-- Center circle + spot -->
  <circle cx="34" cy="52.5" r="9.15" fill="none" stroke="white" stroke-width="0.7"/>
  <circle cx="34" cy="52.5" r="0.8" fill="white"/>
  <!-- Top penalty area -->
  <rect x="13.84" y="0" width="40.32" height="16.5" fill="none" stroke="white" stroke-width="0.7"/>
  <!-- Top 6-yard box -->
  <rect x="24.84" y="0" width="18.32" height="5.5" fill="none" stroke="white" stroke-width="0.7"/>
  <!-- Top penalty spot -->
  <circle cx="34" cy="11" r="0.8" fill="white"/>
  <!-- Top penalty arc (bulges into pitch) -->
  <path d="M 26.69 16.5 A 9.15 9.15 0 0 1 41.31 16.5" fill="none" stroke="white" stroke-width="0.7"/>
  <!-- Bottom penalty area -->
  <rect x="13.84" y="88.5" width="40.32" height="16.5" fill="none" stroke="white" stroke-width="0.7"/>
  <!-- Bottom 6-yard box -->
  <rect x="24.84" y="99.5" width="18.32" height="5.5" fill="none" stroke="white" stroke-width="0.7"/>
  <!-- Bottom penalty spot -->
  <circle cx="34" cy="94" r="0.8" fill="white"/>
  <!-- Bottom penalty arc (bulges into pitch) -->
  <path d="M 26.69 88.5 A 9.15 9.15 0 0 0 41.31 88.5" fill="none" stroke="white" stroke-width="0.7"/>
  <!-- Corner arcs (r=2.5 SVG units ≈ 1m) -->
  <path d="M 0 2.5 A 2.5 2.5 0 0 1 2.5 0" fill="none" stroke="white" stroke-width="0.7"/>
  <path d="M 65.5 0 A 2.5 2.5 0 0 1 68 2.5" fill="none" stroke="white" stroke-width="0.7"/>
  <path d="M 68 102.5 A 2.5 2.5 0 0 1 65.5 105" fill="none" stroke="white" stroke-width="0.7"/>
  <path d="M 2.5 105 A 2.5 2.5 0 0 1 0 102.5" fill="none" stroke="white" stroke-width="0.7"/>
</svg>`;

const clubAbbr = (c) => CLUBS[c]?.abbr || c.slice(0, 3).toUpperCase();
const yy = (year) => `'${String(year % 100).padStart(2, "0")}`;

// Returns the inner HTML (SVG + slots) for a pitch given the current picks.
// When `showMedia` is true, each filled slot also shows the player's overall.
export function pitchSlotsHTML(picks, { showMedia = false } = {}) {
  return PITCH_SVG + FORMATION_442.map(slot => {
    const pick = picks.find(p => p.slotId === slot.id);
    return `<div class="slot ${pick ? "filled" : ""}" style="left:${slot.x}%; top:${slot.y}%">
      <span class="slot-pos">${slot.pos}</span>
      <span class="slot-name">${pick ? pick.player.name : ""}</span>
      <span class="slot-team">${pick ? `${clubAbbr(pick.club)} ${yy(pick.year)}` : ""}</span>
      ${showMedia && pick ? `<span class="slot-media">${pick.player.media}</span>` : ""}
    </div>`;
  }).join("");
}

// Average media (overall) of the picked XI, rounded.
export function teamMedia(picks) {
  if (!picks.length) return 0;
  return Math.round(picks.reduce((a, p) => a + p.player.media, 0) / picks.length);
}
