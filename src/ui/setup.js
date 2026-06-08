import { CLUBS } from "../data/clubs.js";
import { COMBOS } from "../data/combos.js";

// Setup: pick a real club + season. That club is who you play as.
// Calls onDone({ club, year }).
export function renderSetup(root, onDone) {
  const cards = COMBOS
    .map(([club, year]) => ({ club, year, name: CLUBS[club]?.name || club }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.year - b.year);

  root.innerHTML = `
    <section class="screen setup">
      <h1 class="brand">Albacete <span>–</span> Logroñés</h1>
      <p class="tagline">Pick your club &amp; season. Draft 4 of their players, then spin for the rest — and live five seasons.</p>
      <div class="club-grid">
        ${cards.map((c, i) => `
          <button class="club-card" data-i="${i}">
            <span class="cc-name">${c.name}</span>
            <span class="cc-year">${c.year}–${String((c.year + 1) % 100).padStart(2, "0")}</span>
          </button>`).join("")}
      </div>
    </section>`;

  root.querySelectorAll(".club-card").forEach(btn => {
    btn.addEventListener("click", () => {
      const c = cards[Number(btn.dataset.i)];
      onDone({ club: c.club, year: c.year });
    });
  });
}
