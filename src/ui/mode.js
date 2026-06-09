// First screen: a short explainer, then pick a mode. The four modes split into
// two families — the roulette game (Clásico / Maldiniano) and Mi Equipo
// (Mi Equipo / Mi Equipo Random). Calls onPick(mode); onWiki opens the wiki.
export function renderModeSelect(root, onPick, onWiki) {
  root.innerHTML = `
    <section class="screen setup">
      <h1 class="brand">Gol De <span>Oro</span></h1>
      <h2 class="brand-sub">Simula 5 temporadas reales de liga retro</h2>

      <p class="tagline">Eliges un club y una temporada y montas tu <b>once ideal</b>.<br>
      Los jóvenes crecen, los veteranos caen.<br>
      Tu meta: <b>el máximo de puntos posible</b>… o el mínimo, si te atreves.</p>

      <h2 class="setup-heading">Elige tu modo de juego</h2>

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
          <p class="mode-group-desc">Montas el once completo de golpe, sin fichar 4 y girar.</p>
        </div>
        <div class="mode-grid">
          <button class="mode-card mode-card-mine" data-mode="miequipo">
            <span class="mode-name">Mi Equipo</span>
            <span class="mode-desc">Sin ruleta: eliges tú los 11 de un único club y temporada.</span>
          </button>
          <button class="mode-card mode-card-rand" data-mode="miequipo-random">
            <span class="mode-name">Mi Equipo Random</span>
            <span class="mode-desc">La ruleta sortea los 11 por ti, de clubes y años al azar.</span>
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
