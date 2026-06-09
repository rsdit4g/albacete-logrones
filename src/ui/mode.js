// First screen: explain the universal flow, then pick a mode. All four modes
// play the same 5 simulated seasons — they differ only in HOW you build the XI
// and WHAT you see while doing it. Calls onPick(mode); onWiki opens the wiki.
//   Clásico          — 4 fichados + ruleta, stats visible.
//   Maldiniano       — 4 fichados + ruleta, but blind (name + position only).
//   Mi Equipo        — no ruleta: you pick all 11 from one club + season.
//   Mi Equipo Random — no choosing: the ruleta assembles your 11 for you.
export function renderModeSelect(root, onPick, onWiki) {
  root.innerHTML = `
    <section class="screen setup">
      <h1 class="brand">Gol De <span>Oro</span></h1>
      <h2 class="brand-sub">Crea tu dinastía</h2>

      <div class="how-it-works">
        <h2 class="setup-heading">Cómo funciona</h2>
        <ol class="how-list">
          <li>Eliges una temporada y un club: ese será tu equipo en La Liga.</li>
          <li>Montas tu once en un 4-4-2. <b>Cómo lo montas depende del modo</b> que elijas abajo.</li>
          <li>Con el once listo, el juego simula 5 temporadas insertando a tu equipo en clasificaciones históricas reales de La Liga.</li>
          <li>La edad manda: con los años los jóvenes suben su media y los veteranos la pierden. La edad de cada jugador es tu pista, pero cuánto crece o cae tendrás que adivinarlo.</li>
          <li>Objetivo: lograr el máximo de puntos posible en esas 5 temporadas. O el mínimo, si te atreves.</li>
        </ol>
      </div>

      <h2 class="setup-heading">Elige modo de juego</h2>
      <p class="mode-intro">Los cuatro modos juegan las mismas 5 temporadas. Solo cambia <b>cómo montas tu once</b> y <b>qué ves</b> al hacerlo.</p>
      <div class="mode-grid">
        <button class="mode-card" data-mode="clasico">
          <span class="mode-name">Clásico</span>
          <span class="mode-tag">Fichas 4 + ruleta · con estadísticas</span>
          <span class="mode-desc">Fichas a 4 jugadores de tu club y la ruleta sortea el resto, uno a uno (con 2 giros extra). Ves todas las estadísticas: velocidad, resistencia, agresividad, calidad y media.</span>
        </button>
        <button class="mode-card mode-card-mald" data-mode="maldiniano">
          <span class="mode-name">Maldiniano</span>
          <span class="mode-tag">Fichas 4 + ruleta · a ciegas</span>
          <span class="mode-desc">Igual que el Clásico —4 fichados y ruleta— pero solo ves nombre y posición. Fichas a ciegas, como un viejo ojeador.</span>
        </button>
        <button class="mode-card mode-card-mine" data-mode="miequipo">
          <span class="mode-name">Mi Equipo</span>
          <span class="mode-tag">Eliges tú los 11 · con estadísticas</span>
          <span class="mode-desc">Sin ruleta. Eliges tú los 11 jugadores de un único club y temporada: tu plantilla, tu once.</span>
        </button>
        <button class="mode-card mode-card-rand" data-mode="miequipo-random">
          <span class="mode-name">Mi Equipo Random</span>
          <span class="mode-tag">La ruleta elige los 11 · al azar</span>
          <span class="mode-desc">Sin elegir nada. La ruleta sortea por ti los 11 jugadores, de clubes y temporadas al azar. Tú solo giras y rezas.</span>
        </button>
      </div>

      <button class="wiki-link" id="wikiLink">📚 Histórico real · resultados de cada temporada</button>
    </section>`;

  root.querySelectorAll(".mode-card").forEach(b =>
    b.addEventListener("click", () => onPick(b.dataset.mode)));
  const wikiLink = root.querySelector("#wikiLink");
  if (wikiLink && onWiki) wikiLink.addEventListener("click", onWiki);
}
