// First screen: explain the game, then pick how you want to play.
// Calls onPick("clasico" | "maldiniano"); onWiki opens the real-results page.
//   Clásico    — the full game: every player's stats are visible.
//   Maldiniano — same game, but you only see name + position. Scout blind.
export function renderModeSelect(root, onPick, onWiki) {
  root.innerHTML = `
    <section class="screen setup">
      <h1 class="brand">Gol De <span>Oro</span></h1>
      <h2 class="brand-sub">Crea tu dinastía</h2>

      <div class="how-it-works">
        <h2 class="setup-heading">Cómo funciona</h2>
        <ol class="how-list">
          <li>Eliges una temporada y un club para empezar. De esa plantilla fichas a tus primeros 4 jugadores.</li>
          <li>Después una ruleta sortea un club y una temporada al azar. En cada sorteo eliges un jugador, hasta completar un 4-4-2 con 11 futbolistas.</li>
          <li>Tienes 2 giros extra en toda la partida por si un sorteo no te convence.</li>
          <li>Con tu once montado, el juego simula 5 temporadas insertando a tu equipo en clasificaciones históricas reales de La Liga.</li>
          <li>La edad manda: con los años los jóvenes suben su media y los veteranos la pierden. La edad de cada jugador es tu pista, pero cuánto crece o cae tendrás que adivinarlo.</li>
          <li>Objetivo: lograr el máximo de puntos posible en esas 5 temporadas. O el mínimo, si te atreves.</li>
        </ol>
      </div>

      <h2 class="setup-heading">Elige modo de juego</h2>
      <div class="mode-grid">
        <button class="mode-card" data-mode="clasico">
          <span class="mode-name">Clásico</span>
          <span class="mode-desc">Ves todas las estadísticas de cada jugador: velocidad, resistencia, agresividad, calidad y media.</span>
        </button>
        <button class="mode-card mode-card-mald" data-mode="maldiniano">
          <span class="mode-name">Maldiniano</span>
          <span class="mode-desc">Solo ves el nombre y la posición. Fichas a ciegas, como un viejo ojeador. El resto del juego es idéntico.</span>
        </button>
      </div>

      <button class="wiki-link" id="wikiLink">📚 Histórico real · resultados de cada temporada</button>
    </section>`;

  root.querySelectorAll(".mode-card").forEach(b =>
    b.addEventListener("click", () => onPick(b.dataset.mode)));
  const wikiLink = root.querySelector("#wikiLink");
  if (wikiLink && onWiki) wikiLink.addEventListener("click", onWiki);
}
