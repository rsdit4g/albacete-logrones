import { COMBOS } from "../data/combos.js?v=31";
import { CLUBS } from "../data/clubs.js";

// Two-step selection: pick year → pick club from that season.
// Calls onDone({ club, year }).
export function renderSetup(root, onDone) {
  const years = [...new Set(COMBOS.map(([, y]) => y))].sort((a, b) => a - b);

  function seasonLabel(y) {
    return `${y}–${String((y + 1) % 100).padStart(2, "0")}`;
  }

  function showYears() {
    root.innerHTML = `
      <section class="screen setup">
        <h1 class="brand">Albacete <span>–</span> Logroñés</h1>
        <h2 class="brand-sub">Crea tu dinastía</h2>
        <p class="tagline">Elige una temporada y club para empezar, podrás seleccionar hasta cuatro jugadores de esa plantilla. Después la ruleta te dará selecciones aleatorias de equipos y año para elegir uno cada vez.</p>
        <p class="setup-objective"><b>Objetivo:</b> conseguir el máximo número de puntos posible en cinco temporadas… ¡o el mínimo!</p>
        <h2 class="setup-heading">Elige una temporada</h2>
        <div class="year-grid">
          ${years.map(y => `<button class="year-btn" data-y="${y}">${seasonLabel(y)}</button>`).join("")}
        </div>
      </section>`;

    root.querySelectorAll(".year-btn").forEach(btn =>
      btn.addEventListener("click", () => showClubs(Number(btn.dataset.y))));
  }

  function showClubs(year) {
    const clubs = COMBOS
      .filter(([, y]) => y === year)
      .map(([club]) => club)
      .sort((a, b) => a.localeCompare(b));

    root.innerHTML = `
      <section class="screen setup">
        <h1 class="brand">Albacete <span>–</span> Logroñés</h1>
        <button class="setup-back" id="backBtn">← Temporadas</button>
        <h2 class="setup-heading">Elige tu club · ${seasonLabel(year)}</h2>
        <div class="club-grid">
          ${clubs.map((club, i) => `
            <button class="club-card" data-i="${i}">
              <span class="cc-name">${CLUBS[club]?.name || club}</span>
              <span class="cc-year">${seasonLabel(year)}</span>
            </button>`).join("")}
        </div>
      </section>`;

    root.querySelector("#backBtn").addEventListener("click", showYears);
    root.querySelectorAll(".club-card").forEach(btn =>
      btn.addEventListener("click", () => {
        const club = clubs[Number(btn.dataset.i)];
        onDone({ club, year });
      }));
  }

  showYears();
}
