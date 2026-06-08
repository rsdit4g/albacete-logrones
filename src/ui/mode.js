// First screen: pick how you want to play. Calls onPick("clasico" | "maldiniano").
//   Clásico    — the full game: every player's stats are visible.
//   Maldiniano — same game, but you only see name + position. Scout blind.
export function renderModeSelect(root, onPick) {
  root.innerHTML = `
    <section class="screen setup">
      <h1 class="brand">Albacete <span>–</span> Logroñés</h1>
      <h2 class="brand-sub">Crea tu dinastía</h2>
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
    </section>`;

  root.querySelectorAll(".mode-card").forEach(b =>
    b.addEventListener("click", () => onPick(b.dataset.mode)));
}
