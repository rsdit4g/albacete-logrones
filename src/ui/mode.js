// First screen: a short explainer, then pick a mode. The four modes split into
// two families — the roulette game (Clásico / Maldiniano) and Mi Equipo
// (Mi Equipo / Mi Equipo Random). Calls onPick(mode); onWiki opens the wiki.
export function renderModeSelect(root, onPick, onWiki) {
  root.innerHTML = `
    <section class="screen setup">
      <h1 class="brand">Gol De <span>Oro</span></h1>
      <h2 class="brand-sub">Crea tu dinastía</h2>

      <p class="tagline">Eliges un club y una temporada, montas tu once y el juego simula 5 temporadas en La Liga real. Con los años los jóvenes mejoran y los veteranos bajan. Objetivo: el máximo de puntos posible… o el mínimo.</p>

      <h2 class="setup-heading">Elige modo de juego</h2>

      <div class="mode-group">
        <div class="mode-group-head">
          <h3 class="mode-group-title">Con ruleta</h3>
          <p class="mode-group-desc">Fichas 4 jugadores de tu club y la ruleta sortea el resto.</p>
        </div>
        <div class="mode-grid">
          <button class="mode-card" data-mode="clasico">
            <span class="mode-name">Clásico</span>
            <span class="mode-desc">Ves todas las estadísticas de cada jugador.</span>
          </button>
          <button class="mode-card mode-card-mald" data-mode="maldiniano">
            <span class="mode-name">Maldiniano</span>
            <span class="mode-desc">Solo ves nombre y posición. Fichas a ciegas.</span>
          </button>
        </div>
      </div>

      <div class="mode-group">
        <div class="mode-group-head">
          <h3 class="mode-group-title">Mi Equipo</h3>
          <p class="mode-group-desc">Tu once de un solo club y temporada, sin ruleta.</p>
        </div>
        <div class="mode-grid">
          <button class="mode-card mode-card-mine" data-mode="miequipo">
            <span class="mode-name">Mi Equipo</span>
            <span class="mode-desc">Eliges tú los 11 jugadores.</span>
          </button>
          <button class="mode-card mode-card-rand" data-mode="miequipo-random">
            <span class="mode-name">Mi Equipo Random</span>
            <span class="mode-desc">La ruleta elige los 11 por ti, al azar.</span>
          </button>
        </div>
      </div>

      <button class="wiki-link" id="wikiLink">📚 Histórico real · resultados de cada temporada</button>
    </section>`;

  root.querySelectorAll(".mode-card").forEach(b =>
    b.addEventListener("click", () => onPick(b.dataset.mode)));
  const wikiLink = root.querySelector("#wikiLink");
  if (wikiLink && onWiki) wikiLink.addEventListener("click", onWiki);
}
