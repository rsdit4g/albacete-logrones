import { YEAR_RANGE } from "../data/combos.js";

// Renders the setup screen. Calls onDone({ teamName, startYear }) when started.
export function renderSetup(root, onDone) {
  root.innerHTML = `
    <section class="screen setup">
      <h1 class="brand">Albacete <span>–</span> Logroñés</h1>
      <p class="tagline">Name your club, draft your XI, live five seasons.</p>
      <label class="field">
        <span>Club name</span>
        <input id="teamName" maxlength="28" placeholder="e.g. Riojano CF" />
      </label>
      <label class="field">
        <span>Start year</span>
        <input id="startYear" type="number" min="${YEAR_RANGE.min}" max="${YEAR_RANGE.max}" value="1994" />
      </label>
      <button id="startBtn" class="primary" disabled>Start drafting →</button>
      <p class="hint" id="setupHint">Enter a club name to begin.</p>
    </section>`;

  const name = root.querySelector("#teamName");
  const year = root.querySelector("#startYear");
  const btn = root.querySelector("#startBtn");

  function refresh() {
    btn.disabled = name.value.trim().length === 0;
  }
  name.addEventListener("input", refresh);
  btn.addEventListener("click", () => {
    const y = Math.max(YEAR_RANGE.min, Math.min(YEAR_RANGE.max, Number(year.value) || 1994));
    onDone({ teamName: name.value.trim(), startYear: y });
  });
  name.focus();
}
