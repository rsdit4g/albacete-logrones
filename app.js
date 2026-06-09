import { renderModeSelect } from "./src/ui/mode.js?v=33";
import { renderSetup } from "./src/ui/setup.js?v=32";
import { renderDraft } from "./src/ui/draft.js?v=34";
import { renderResults } from "./src/ui/results.js?v=34";
import { createDraft } from "./src/game/draft.js";
import { createRng } from "./src/engine/rng.js";
import { simulateFiveYears } from "./src/engine/simulate.js?v=35";
import { SQUADS } from "./src/data/squads.js?v=31";
import { COMBOS } from "./src/data/combos.js?v=31";
import { SEASONS } from "./src/data/seasons.js";

const root = document.getElementById("app");

// One run seed per game so spins + sim are reproducible within a session.
function newSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

function startGame() {
  // First screen: choose play mode (Clásico shows stats, Maldiniano hides them).
  renderModeSelect(root, (mode) => {
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

// A restart control that lives outside #app, so it stays available on every screen.
const restartBtn = document.getElementById("restartBtn");
if (restartBtn) restartBtn.addEventListener("click", startGame);

startGame();
