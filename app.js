import { renderModeSelect } from "./src/ui/mode.js?v=34";
import { renderSetup } from "./src/ui/setup.js?v=32";
import { renderDraft } from "./src/ui/draft.js?v=36";
import { renderResults } from "./src/ui/results.js?v=34";
import { createDraft } from "./src/game/draft.js";
import { createRng } from "./src/engine/rng.js";
import { simulateFiveYears } from "./src/engine/simulate.js?v=36";
import { SQUADS } from "./src/data/squads.js?v=31";
import { COMBOS } from "./src/data/combos.js?v=31";
import { SEASONS } from "./src/data/seasons.js";

const root = document.getElementById("app");

// A restart control that lives outside #app, so it stays available on every
// screen except the Home (mode-select) screen, where there's nothing to restart.
const restartBtn = document.getElementById("restartBtn");
const showRestart = (on) => { if (restartBtn) restartBtn.hidden = !on; };
if (restartBtn) restartBtn.addEventListener("click", startGame);

// One run seed per game so spins + sim are reproducible within a session.
function newSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

function startGame() {
  // First screen: choose play mode (Clásico shows stats, Maldiniano hides them).
  showRestart(false); // Home screen — hide restart
  renderModeSelect(root, (mode) => {
    showRestart(true); // a run has begun — restart is now available
    renderSetup(root, ({ club, year }) => {
      const seed = newSeed();
      const draft = createDraft(createRng(seed));
      renderDraft(root, club, year, draft, { SQUADS, COMBOS, mode }, (finished) => {
        const seasons = simulateFiveYears(finished.picks, year, { SEASONS }, seed, club);
        renderResults(root, seasons, club, finished.picks, startGame);
      });
    });
  });
}

startGame();
