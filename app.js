import { renderSetup } from "./src/ui/setup.js";
import { renderDraft } from "./src/ui/draft.js";
import { renderResults } from "./src/ui/results.js";
import { createDraft } from "./src/game/draft.js";
import { createRng } from "./src/engine/rng.js";
import { simulateFiveYears } from "./src/engine/simulate.js";
import { SQUADS } from "./src/data/squads.js";
import { COMBOS } from "./src/data/combos.js";
import { SEASONS } from "./src/data/seasons.js";

const root = document.getElementById("app");

// One run seed per game so spins + sim are reproducible within a session.
function newSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

function startGame() {
  renderSetup(root, ({ teamName, startYear }) => {
    const seed = newSeed();
    const draft = createDraft(createRng(seed));
    renderDraft(root, draft, { SQUADS, COMBOS }, (finished) => {
      const seasons = simulateFiveYears(finished.picks, startYear, { SEASONS }, seed, teamName);
      renderResults(root, seasons, teamName, startGame);
    });
  });
}

startGame();
