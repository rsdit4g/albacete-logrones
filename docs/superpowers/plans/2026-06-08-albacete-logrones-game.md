# Albacete – Logroñés Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the playable core of *Albacete – Logroñés* — name a club, draft a 4-4-2 XI from real historical La Liga squads, then simulate five seasons by inserting the team into real historical league tables, and present a season-by-season result.

**Architecture:** Vanilla HTML/CSS/JS, no build step. All game logic lives in pure ES modules under `src/` (data, engine, game-state) that are unit-tested with Node's built-in test runner (`node --test`, zero dependencies). UI render modules under `src/ui/` are thin DOM glue, wired by `app.js`, and verified in the browser with the preview tools rather than unit-tested. The browser loads the same ES modules via `<script type="module">`.

**Tech Stack:** HTML5, CSS3, JavaScript ES modules, `node --test` for unit tests. No framework, no bundler.

**Scope:** This plan delivers the playable game with a small real sample dataset (Albacete Balompié & CD Logroñés, mid-90s window) and stubbed player ratings. **Out of scope (future plans):** ads/IAP, SEO/content pages, consent banner, multiple formations, Classic/Expert modes, crests/colours, the full 1980–2025 dataset, native wrapper, real match simulation. The data schema and module boundaries are built so these drop in later.

**Determinism:** All randomness flows through a single seeded RNG (`createRng(seed)`) so simulations and draft spins are reproducible and testable. The same seed + same inputs always produce the same result.

---

## File Structure

```
index.html                  # single page: setup / draft / results sections
styles.css                  # all styling
app.js                       # entry point; orchestrates screen flow, owns RNG seed
package.json                 # type:module, test script
src/
  engine/
    rng.js                   # seeded PRNG (mulberry32)
    strength.js              # team strength from drafted XI
    aging.js                 # age/peak curve, projected overall over time
    simulate.js              # project points, insert into real table, cups, 5-year sim
  game/
    formation.js             # 4-4-2 slot definitions + position-fit scoring
    draft.js                 # draft state machine: spin, draft, completion
  data/
    clubs.js                 # CODE -> { name }
    seasons.js               # YEAR -> { divisionSize, pointsForWin, finalTable[], topScorers[] }
    squads.js                # "CLUB|YEAR" -> [ player ]
    validate.js              # runtime schema validation used by tests
  ui/
    setup.js                 # team-name + start-year screen
    draft.js                 # spin reels + draft list + 4-4-2 pitch
    results.js               # season-by-season results (option B)
test/
  *.test.js                  # one file per logic module
```

**Shared types (used consistently across all tasks):**

```js
// Player (in squads.js). Stat fields blank/stubbed in v1.
{ name: "R. Sánchez", positions: ["ST","CF"], age: 27, overall: 78,
  pac: 0, sho: 0, pas: 0, dri: 0, def: 0, phy: 0 }

// Slot (formation.js): one of the 11 positions in 4-4-2
{ id: "ST1", role: "ST", x: 35, y: 12, eligible: ["ST","CF"] }

// Drafted pick (draft state): a player assigned to a slot
{ slotId: "ST1", club: "LOG", year: 1994, player: <Player> }

// Season data (seasons.js)
{ divisionSize: 20, pointsForWin: 3,
  finalTable: [ { club: "RMA", pts: 82 }, ... ],          // real clubs, length = divisionSize
  topScorers: [ { name: "Zamorano", club: "RMA", goals: 28 }, ... ] }

// Record (computed for display)
{ P: 38, W: 24, D: 8, L: 6, GF: 71, GA: 34, Pts: 80 }

// SeasonResult (simulate.js output, one per simulated year)
{ year: 1995, position: 2, record: <Record>, honours: ["Copa del Rey"],
  table: [ { club, pts, isYou } ],  topScorers: [ { name, club, goals, isYou } ] }
```

---

## Task 1: Project scaffold + test runner

**Files:**
- Create: `package.json`
- Create: `test/smoke.test.js`
- Create: `index.html`
- Create: `styles.css`
- Create: `app.js`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "albacete-logrones",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: Write a smoke test in `test/smoke.test.js`**

```js
import { test } from "node:test";
import assert from "node:assert/strict";

test("test runner works", () => {
  assert.equal(1 + 1, 2);
});
```

- [ ] **Step 3: Run it to verify the runner works**

Run: `npm test`
Expected: PASS, 1 test passing.

- [ ] **Step 4: Create minimal `index.html` shell**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Albacete – Logroñés</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main id="app"><!-- screens injected here --></main>
  <footer class="disclaimer">
    Unofficial fan game. Not affiliated with or endorsed by LaLiga or any club. For entertainment only.
  </footer>
  <script type="module" src="app.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create placeholder `styles.css` and `app.js`**

`styles.css`:
```css
:root { color-scheme: dark; }
body { margin: 0; font-family: system-ui, sans-serif; background: #0a0a12; color: #eee; }
.disclaimer { font-size: 11px; opacity: .5; text-align: center; padding: 16px; }
```

`app.js`:
```js
// Entry point. Screen orchestration added in Task 13.
console.log("Albacete – Logroñés booting…");
```

- [ ] **Step 6: Commit**

```bash
git add package.json test/smoke.test.js index.html styles.css app.js
git commit -m "chore: scaffold project + node test runner"
```

---

## Task 2: Seeded RNG

**Files:**
- Create: `src/engine/rng.js`
- Test: `test/rng.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRng } from "../src/engine/rng.js";

test("same seed produces same sequence", () => {
  const a = createRng(42), b = createRng(42);
  assert.equal(a(), b());
  assert.equal(a(), b());
});

test("values are in [0,1)", () => {
  const r = createRng(1);
  for (let i = 0; i < 100; i++) {
    const v = r();
    assert.ok(v >= 0 && v < 1, `out of range: ${v}`);
  }
});

test("different seeds diverge", () => {
  assert.notEqual(createRng(1)(), createRng(2)());
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module `../src/engine/rng.js`.

- [ ] **Step 3: Implement `src/engine/rng.js`**

```js
// mulberry32: tiny deterministic PRNG, returns () => float in [0,1)
export function createRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Helper: integer in [min, max] inclusive
export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/rng.js test/rng.test.js
git commit -m "feat: seeded RNG (mulberry32)"
```

---

## Task 3: Formation + position fit (4-4-2)

**Files:**
- Create: `src/game/formation.js`
- Test: `test/formation.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { FORMATION_442, positionFit, openSlots } from "../src/game/formation.js";

test("4-4-2 has 11 slots with unique ids", () => {
  assert.equal(FORMATION_442.length, 11);
  assert.equal(new Set(FORMATION_442.map(s => s.id)).size, 11);
});

test("exact position match scores 1", () => {
  assert.equal(positionFit(["ST"], "ST"), 1);
});

test("eligible-but-not-primary scores 0.8", () => {
  assert.equal(positionFit(["CF","ST"], "ST"), 1); // ST present -> full
  assert.equal(positionFit(["CF"], "ST"), 0.8);    // related, eligible
});

test("ineligible position scores low (0.4)", () => {
  assert.equal(positionFit(["GK"], "ST"), 0.4);
});

test("openSlots returns slots not present in filled ids", () => {
  const open = openSlots(["GK","ST1"]);
  assert.equal(open.length, 9);
  assert.ok(!open.some(s => s.id === "GK"));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `src/game/formation.js`**

```js
// 4-4-2. x/y are percentages on the pitch (y: 0=top/attack, 100=own goal).
export const FORMATION_442 = [
  { id: "GK",  role: "GK",  x: 50, y: 92, eligible: ["GK"] },
  { id: "RB",  role: "RB",  x: 82, y: 70, eligible: ["RB","RWB"] },
  { id: "CB1", role: "CB",  x: 60, y: 74, eligible: ["CB"] },
  { id: "CB2", role: "CB",  x: 40, y: 74, eligible: ["CB"] },
  { id: "LB",  role: "LB",  x: 18, y: 70, eligible: ["LB","LWB"] },
  { id: "RM",  role: "RM",  x: 82, y: 44, eligible: ["RM","RW"] },
  { id: "CM1", role: "CM",  x: 60, y: 48, eligible: ["CM","CDM","CAM"] },
  { id: "CM2", role: "CM",  x: 40, y: 48, eligible: ["CM","CDM","CAM"] },
  { id: "LM",  role: "LM",  x: 18, y: 44, eligible: ["LM","LW"] },
  { id: "ST1", role: "ST",  x: 60, y: 16, eligible: ["ST","CF"] },
  { id: "ST2", role: "ST",  x: 40, y: 16, eligible: ["ST","CF"] },
];

// Fit of a player (their listed positions) in a slot role.
// 1.0  exact role match
// 0.8  role's eligible alternatives (e.g. CF in ST slot)
// 0.4  ineligible (out of position)
export function positionFit(playerPositions, slotRole) {
  const slot = FORMATION_442.find(s => s.role === slotRole) ||
               FORMATION_442.find(s => s.eligible.includes(slotRole));
  const eligible = slot ? slot.eligible : [slotRole];
  if (playerPositions.includes(slotRole)) return 1;
  if (playerPositions.some(p => eligible.includes(p))) return 0.8;
  return 0.4;
}

export function openSlots(filledIds) {
  return FORMATION_442.filter(s => !filledIds.includes(s.id));
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/formation.js test/formation.test.js
git commit -m "feat: 4-4-2 formation + position fit"
```

---

## Task 4: Team strength

**Files:**
- Create: `src/engine/strength.js`
- Test: `test/strength.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { teamStrength } from "../src/engine/strength.js";

const xi = (ovr) => Array.from({ length: 11 }, (_, i) => ({
  slotId: "GK", // role irrelevant here; fit forced via positions
  player: { overall: ovr, positions: ["GK"] },
}));

test("strength scales with overall ratings", () => {
  const weak = teamStrength(xi(60));
  const strong = teamStrength(xi(90));
  assert.ok(strong > weak);
});

test("strength of an all-90 perfectly-fit XI is ~90", () => {
  // GK slot with GK player => fit 1
  const s = teamStrength(xi(90));
  assert.ok(Math.abs(s - 90) < 1, `got ${s}`);
});

test("out-of-position players lower strength", () => {
  const fit = teamStrength([{ slotId: "ST1", player: { overall: 90, positions: ["ST"] } }]);
  const unfit = teamStrength([{ slotId: "ST1", player: { overall: 90, positions: ["GK"] } }]);
  assert.ok(unfit < fit);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `src/engine/strength.js`**

```js
import { FORMATION_442, positionFit } from "../game/formation.js";

// Team strength = average of (player overall * position fit) across the XI.
// Returns a 0..100-ish scalar. A full XI of 90-rated players in their best
// positions returns ~90.
export function teamStrength(picks) {
  if (!picks.length) return 0;
  let total = 0;
  for (const pick of picks) {
    const slot = FORMATION_442.find(s => s.id === pick.slotId);
    const role = slot ? slot.role : pick.player.positions[0];
    total += pick.player.overall * positionFit(pick.player.positions, role);
  }
  return total / picks.length;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/strength.js test/strength.test.js
git commit -m "feat: team strength from drafted XI"
```

---

## Task 5: Aging curve

**Files:**
- Create: `src/engine/aging.js`
- Test: `test/aging.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { projectedOverall } from "../src/engine/aging.js";

test("no change at year 0", () => {
  assert.equal(projectedOverall(80, 27, 0), 80);
});

test("a young player improves slightly over a couple of years", () => {
  assert.ok(projectedOverall(75, 21, 2) > 75);
});

test("a player in their 30s declines over five years", () => {
  assert.ok(projectedOverall(85, 31, 5) < 85);
});

test("overall is clamped to [40,99]", () => {
  assert.ok(projectedOverall(99, 19, 3) <= 99);
  assert.ok(projectedOverall(45, 38, 5) >= 40);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `src/engine/aging.js`**

```js
// Per-year overall delta based on the age the player will be that year.
// Peak ~24-28. Young players gain, older players decline; effect grows with age.
function yearlyDelta(age) {
  if (age <= 20) return 1.5;
  if (age <= 23) return 1.0;
  if (age <= 28) return 0;      // peak plateau
  if (age <= 31) return -1.5;
  if (age <= 34) return -3;
  return -4.5;
}

// Project a player's overall `yearsLater` seasons from now, given current age.
export function projectedOverall(baseOverall, baseAge, yearsLater) {
  let ovr = baseOverall;
  for (let y = 1; y <= yearsLater; y++) {
    ovr += yearlyDelta(baseAge + y);
  }
  return Math.max(40, Math.min(99, Math.round(ovr)));
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/aging.js test/aging.test.js
git commit -m "feat: age/peak curve for multi-season projection"
```

---

## Task 6: Data schema + validation + sample data

**Files:**
- Create: `src/data/clubs.js`
- Create: `src/data/seasons.js`
- Create: `src/data/squads.js`
- Create: `src/data/validate.js`
- Test: `test/data.test.js`

> **Data note:** Player rosters and table figures below are a **representative real-era sample** (real club names, mid-90s window). Exact rosters/points must be verified against a historical source (e.g. bdfutbol.com) before launch — but the schema is final and the engine does not depend on accuracy. Only **Albacete (ALB)** and **Logroñés (LOG)** need draftable squads in v1; all other clubs appear only as `finalTable` rows.

- [ ] **Step 1: Write the failing test**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { CLUBS } from "../src/data/clubs.js";
import { SEASONS } from "../src/data/seasons.js";
import { SQUADS } from "../src/data/squads.js";
import { validateData } from "../src/data/validate.js";

test("data validates against schema", () => {
  const errors = validateData({ CLUBS, SEASONS, SQUADS });
  assert.deepEqual(errors, [], errors.join("\n"));
});

test("each season's final table length equals its division size", () => {
  for (const [year, s] of Object.entries(SEASONS)) {
    assert.equal(s.finalTable.length, s.divisionSize, `year ${year}`);
  }
});

test("draftable squads exist for the sample window", () => {
  assert.ok(SQUADS["LOG|1994"]?.length >= 11);
  assert.ok(SQUADS["ALB|1994"]?.length >= 11);
});

test("every squad can field a legal 4-4-2 (has >=1 GK and >=10 outfield)", () => {
  for (const [key, squad] of Object.entries(SQUADS)) {
    const gks = squad.filter(p => p.positions.includes("GK")).length;
    assert.ok(gks >= 1, `${key} has no GK`);
    assert.ok(squad.length - gks >= 10, `${key} lacks outfield players`);
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find modules.

- [ ] **Step 3: Implement `src/data/validate.js`**

```js
const VALID_POS = new Set([
  "GK","RB","LB","CB","RWB","LWB","CDM","CM","CAM","RM","LM","RW","LW","CF","ST"
]);

export function validateData({ CLUBS, SEASONS, SQUADS }) {
  const errors = [];
  const clubCodes = new Set(Object.keys(CLUBS));

  for (const [year, s] of Object.entries(SEASONS)) {
    if (!Number.isInteger(s.divisionSize)) errors.push(`season ${year}: divisionSize`);
    if (![2, 3].includes(s.pointsForWin)) errors.push(`season ${year}: pointsForWin must be 2 or 3`);
    if (!Array.isArray(s.finalTable)) errors.push(`season ${year}: finalTable`);
    for (const row of s.finalTable || []) {
      if (!clubCodes.has(row.club)) errors.push(`season ${year}: unknown club ${row.club}`);
      if (typeof row.pts !== "number") errors.push(`season ${year}: pts for ${row.club}`);
    }
    for (const sc of s.topScorers || []) {
      if (typeof sc.goals !== "number" || !sc.name) errors.push(`season ${year}: bad top scorer`);
    }
  }

  for (const [key, squad] of Object.entries(SQUADS)) {
    const [club, year] = key.split("|");
    if (!clubCodes.has(club)) errors.push(`squad ${key}: unknown club`);
    if (!SEASONS[year]) errors.push(`squad ${key}: unknown year`);
    for (const p of squad) {
      if (!p.name) errors.push(`squad ${key}: player missing name`);
      if (!Array.isArray(p.positions) || p.positions.some(x => !VALID_POS.has(x)))
        errors.push(`squad ${key}: bad positions for ${p.name}`);
      if (typeof p.overall !== "number") errors.push(`squad ${key}: overall for ${p.name}`);
      if (typeof p.age !== "number") errors.push(`squad ${key}: age for ${p.name}`);
    }
  }
  return errors;
}
```

- [ ] **Step 4: Implement `src/data/clubs.js`**

```js
// Real clubs appearing in the sample seasons. Codes are 3-letter.
export const CLUBS = {
  ALB: { name: "Albacete Balompié" },
  LOG: { name: "CD Logroñés" },
  RMA: { name: "Real Madrid" },
  FCB: { name: "FC Barcelona" },
  ATM: { name: "Atlético de Madrid" },
  DEP: { name: "Deportivo de La Coruña" },
  VAL: { name: "Valencia CF" },
  RBE: { name: "Real Betis" },
  SEV: { name: "Sevilla FC" },
  ESP: { name: "RCD Espanyol" },
  ATH: { name: "Athletic Club" },
  RSO: { name: "Real Sociedad" },
  ZAR: { name: "Real Zaragoza" },
  CEL: { name: "RC Celta" },
  OVI: { name: "Real Oviedo" },
  RAC: { name: "Racing de Santander" },
  VLL: { name: "Real Valladolid" },
  TEN: { name: "CD Tenerife" },
  COM: { name: "SD Compostela" },
  SPG: { name: "Sporting de Gijón" },
};
```

- [ ] **Step 5: Implement `src/data/seasons.js`**

> Two sample seasons, both 20-team (representative figures — verify before launch). Add 1996–1998 later by the same shape. `finalTable` is in finishing order, length = `divisionSize`.

```js
function table(...rows) {
  return rows.map(([club, pts]) => ({ club, pts }));
}

export const SEASONS = {
  1994: {
    divisionSize: 20,
    pointsForWin: 2,
    finalTable: table(
      ["FCB", 56], ["DEP", 53], ["RMA", 52], ["ZAR", 47], ["ATM", 45],
      ["SEV", 44], ["ESP", 43], ["VAL", 42], ["ATH", 41], ["TEN", 40],
      ["RSO", 38], ["RBE", 36], ["CEL", 35], ["SPG", 34], ["OVI", 33],
      ["VLL", 32], ["RAC", 31], ["LOG", 30], ["ALB", 29], ["COM", 24],
    ),
    topScorers: [
      { name: "Romário", club: "FCB", goals: 30 },
      { name: "Zamorano", club: "RMA", goals: 28 },
      { name: "Bakero", club: "FCB", goals: 17 },
      { name: "Kodro", club: "RSO", goals: 16 },
    ],
  },
  1995: {
    divisionSize: 20,
    pointsForWin: 3,
    finalTable: table(
      ["RMA", 55], ["DEP", 51], ["FCB", 51], ["RBE", 48], ["ESP", 47],
      ["ATM", 46], ["VAL", 45], ["ZAR", 44], ["TEN", 43], ["SEV", 40],
      ["RAC", 39], ["ATH", 38], ["RSO", 37], ["COM", 36], ["SPG", 35],
      ["OVI", 34], ["VLL", 33], ["CEL", 32], ["LOG", 30], ["ALB", 28],
    ),
    topScorers: [
      { name: "Zamorano", club: "RMA", goals: 28 },
      { name: "Pizzi", club: "TEN", goals: 24 },
      { name: "Alfonso", club: "RBE", goals: 17 },
      { name: "Kodro", club: "FCB", goals: 16 },
    ],
  },
};
```

- [ ] **Step 6: Implement `src/data/squads.js`**

> Draftable squads for ALB & LOG across the sample window. Names are representative real-era players (verify/spell-check before launch). `overall` stubbed (the engine reads it); `age` realistic; stat fields zeroed (filled later). Each squad fields a legal 4-4-2.

```js
// Helper to keep entries terse: p(name, positions, age, overall)
function p(name, positions, age, overall) {
  return { name, positions, age, overall, pac: 0, sho: 0, pas: 0, dri: 0, def: 0, phy: 0 };
}

const LOG_1994 = [
  p("Alberto",      ["GK"],        28, 74),
  p("Aitor",        ["RB","RWB"],  26, 72),
  p("Juanito",      ["CB"],        29, 73),
  p("Cuartero",     ["CB"],        27, 72),
  p("David",        ["LB","LWB"],  25, 71),
  p("Ureña",        ["RM","RW"],   24, 72),
  p("Lozano",       ["CM","CDM"],  30, 73),
  p("Ferrón",       ["CM","CAM"],  27, 72),
  p("Quevedo",      ["LM","LW"],   26, 71),
  p("Ossório",      ["ST","CF"],   28, 74),
  p("Sanjuán",      ["ST"],        24, 71),
  p("Nando",        ["CB","RB"],   23, 69),
  p("Iván",         ["CM"],        22, 68),
  p("Carlos",       ["GK"],        31, 70),
  p("Mena",         ["CF","ST"],   29, 70),
  p("Rubén",        ["RM","CM"],   20, 67),
];

const ALB_1994 = [
  p("Molina",       ["GK"],        24, 75),
  p("Corts",        ["RB"],        28, 72),
  p("Bjelica",      ["CB"],        26, 73),
  p("Antonio",      ["CB"],        30, 72),
  p("Sergi",        ["LB","LWB"],  25, 71),
  p("Catali",       ["RM","CM"],   27, 73),
  p("Zalazar",      ["CM","CAM"],  31, 74),
  p("Coco",         ["CDM","CM"],  29, 72),
  p("Quique",       ["LM","LW"],   26, 71),
  p("Menéndez",     ["ST","CF"],   27, 73),
  p("Pinilla",      ["ST"],        25, 71),
  p("Soler",        ["CB","CDM"],  24, 69),
  p("Vicente",      ["RB","RM"],   23, 68),
  p("Raúl",         ["GK"],        30, 69),
  p("Dani",         ["CF","ST"],   28, 70),
  p("Iñaki",        ["CM"],        21, 67),
];

export const SQUADS = {
  "LOG|1994": LOG_1994,
  "ALB|1994": ALB_1994,
  // 1995 reuses the same rosters one year older (representative);
  // replace with verified 1995 squads later.
  "LOG|1995": LOG_1994.map(x => ({ ...x, age: x.age + 1 })),
  "ALB|1995": ALB_1994.map(x => ({ ...x, age: x.age + 1 })),
};
```

- [ ] **Step 7: Run to verify it passes**

Run: `npm test`
Expected: PASS — all four data tests green.

- [ ] **Step 8: Commit**

```bash
git add src/data/ test/data.test.js
git commit -m "feat: data schema, validation, and mid-90s sample (ALB/LOG)"
```

---

## Task 7: Simulation engine

**Files:**
- Create: `src/engine/simulate.js`
- Test: `test/simulate.test.js`

This is the heart of the game. It exposes:
- `projectedPoints(strength, season)` — map a 0..100 strength to a points total scaled to that season's table.
- `insertIntoTable(season, yourPts, yourName)` — place your team by points, return `{ table, position }`.
- `deriveRecord(points, games, pointsForWin, strength, rng)` — plausible W/D/L/GF/GA for display.
- `simulateSeason(picks, season, year, yearsElapsed, rng, opts)` — full SeasonResult.
- `simulateFiveYears(picks, startYear, { SEASONS }, seed)` — array of 5 SeasonResults.

- [ ] **Step 1: Write the failing test**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRng } from "../src/engine/rng.js";
import {
  projectedPoints, insertIntoTable, deriveRecord, simulateFiveYears,
} from "../src/engine/simulate.js";
import { SEASONS } from "../src/data/seasons.js";

const strongXI = Array.from({ length: 11 }, () => ({
  slotId: "ST1", player: { overall: 95, age: 24, positions: ["ST"] },
}));
const weakXI = Array.from({ length: 11 }, () => ({
  slotId: "ST1", player: { overall: 55, age: 33, positions: ["ST"] },
}));

test("stronger teams project more points", () => {
  const s = SEASONS[1995];
  assert.ok(projectedPoints(90, s) > projectedPoints(60, s));
});

test("insertIntoTable places a title-worthy points total at position 1", () => {
  const s = SEASONS[1995];
  const top = s.finalTable[0].pts;
  const { position, table } = insertIntoTable(s, top + 5, "You FC");
  assert.equal(position, 1);
  assert.equal(table[0].isYou, true);
  assert.equal(table.length, s.divisionSize); // one real club drops out
});

test("derived record is internally consistent", () => {
  const r = deriveRecord(80, 38, 3, 85, createRng(1));
  assert.equal(r.P, 38);
  assert.equal(r.W + r.D + r.L, 38);
  assert.equal(r.W * 3 + r.D, 80); // 3pt season
});

test("five-year sim returns 5 ordered seasons", () => {
  const res = simulateFiveYears(strongXI, 1994, { SEASONS }, 7);
  assert.equal(res.length, 5);
  assert.deepEqual(res.map(r => r.year), [1994, 1995, 1996, 1997, 1998]);
  for (const r of res) {
    assert.ok(r.position >= 1);
    assert.ok(Array.isArray(r.topScorers));
  }
});

test("aging makes an old XI decline across the five years", () => {
  const res = simulateFiveYears(weakXI, 1994, { SEASONS }, 7);
  // weak + aging => later seasons no better than the first
  assert.ok(res[4].position >= res[0].position - 1);
});

test("simulation is deterministic for a fixed seed", () => {
  const a = simulateFiveYears(strongXI, 1994, { SEASONS }, 99);
  const b = simulateFiveYears(strongXI, 1994, { SEASONS }, 99);
  assert.deepEqual(a.map(r => r.position), b.map(r => r.position));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `src/engine/simulate.js`**

```js
import { createRng } from "./rng.js";
import { teamStrength } from "./strength.js";
import { projectedOverall } from "./aging.js";

// Map strength (0..100) to a points total scaled to the season's table.
// Strength 50 ~ mid-table; 100 ~ a few points above the real champion.
export function projectedPoints(strength, season) {
  const champ = season.finalTable[0].pts;
  const bottom = season.finalTable[season.finalTable.length - 1].pts;
  const span = Math.max(8, champ - bottom);
  // strength 30 -> bottom, strength 100 -> champ + small margin
  const t = Math.max(0, Math.min(1, (strength - 30) / 70));
  return Math.round(bottom + t * (span + 4));
}

// Insert your team into the real table by points; one real club drops off
// the bottom so the table stays divisionSize long.
export function insertIntoTable(season, yourPts, yourName) {
  const rows = season.finalTable.map(r => ({ ...r, isYou: false }));
  const you = { club: "__you", name: yourName, pts: yourPts, isYou: true };
  rows.push(you);
  rows.sort((a, b) => b.pts - a.pts);
  const trimmed = rows.slice(0, season.divisionSize);
  const position = trimmed.findIndex(r => r.isYou) + 1;
  // If your team was trimmed off (last), force it into the final place.
  if (position === 0) {
    trimmed[trimmed.length - 1] = you;
    return { table: trimmed, position: season.divisionSize };
  }
  return { table: trimmed, position };
}

// Plausible W/D/L/GF/GA consistent with points & points system, flavoured by strength.
// Guarantees the invariant W*pointsForWin + D === points exactly (D is derived
// from points and W, not estimated independently), and W + D + L === games.
export function deriveRecord(points, games, pointsForWin, strength, rng) {
  const drawRate = pointsForWin === 3 ? 0.22 : 0.26;
  // Estimate a plausible draw count, then solve wins around it.
  let D0 = Math.max(0, Math.min(games, Math.round(games * drawRate + (rng() * 4 - 2))));
  let W = Math.round((points - D0) / pointsForWin);
  W = Math.max(0, Math.min(games, W));
  // Force exact points: draws = points - wins*pointsForWin.
  let D = points - W * pointsForWin;
  while (D < 0 && W < games) { W += 1; D = points - W * pointsForWin; }
  D = Math.max(0, D);
  let L = games - W - D;
  if (L < 0) { D = Math.max(0, D + L); L = games - W - D; } // trim draws to fit games
  if (L < 0) { W = games - D; L = 0; }                       // last resort
  // Goals: scale with strength.
  const gf = Math.round(games * (0.8 + strength / 100));
  const ga = Math.round(games * (1.6 - strength / 100));
  return { P: games, W, D, L, GF: gf, GA: Math.max(0, ga), Pts: points };
}

// Project the XI's strength `yearsElapsed` seasons from draft, applying aging.
function strengthInSeason(picks, yearsElapsed) {
  const aged = picks.map(pk => ({
    slotId: pk.slotId,
    player: {
      ...pk.player,
      overall: projectedOverall(pk.player.overall, pk.player.age, yearsElapsed),
    },
  }));
  return teamStrength(aged);
}

// Resolve a single season into a SeasonResult.
export function simulateSeason(picks, season, year, yearsElapsed, rng, yourName) {
  const base = strengthInSeason(picks, yearsElapsed);
  // +/- variance up to ~4 strength points
  const strength = base + (rng() * 8 - 4);
  const games = (season.divisionSize - 1) * 2;
  let pts = projectedPoints(strength, season);
  // scale points to the season's game count if it differs from a 38-game default
  const { table, position } = insertIntoTable(season, pts, yourName);
  const record = deriveRecord(pts, games, season.pointsForWin, strength, rng);

  // Cups: probability from strength.
  const honours = [];
  if (position === 1) honours.push("La Liga");
  if (rng() < Math.max(0, (strength - 60) / 80)) honours.push("Copa del Rey");

  // Top scorers: blend real list with your best forward (computed goals).
  const topScorers = season.topScorers.map(s => ({ ...s, isYou: false }));
  const myForward = picks
    .map(pk => pk.player)
    .filter(pl => pl.positions.some(p => ["ST", "CF"].includes(p)))
    .sort((a, b) => b.overall - a.overall)[0];
  if (myForward) {
    const goals = Math.round(8 + (strength / 100) * 22 + (rng() * 6 - 3));
    topScorers.push({ name: myForward.name, club: yourName, goals, isYou: true });
  }
  topScorers.sort((a, b) => b.goals - a.goals);

  return { year, position, record, honours, table, topScorers: topScorers.slice(0, 5) };
}

// Simulate five consecutive seasons from startYear. Seasons without data are
// skipped-forward using the nearest available season's shape.
export function simulateFiveYears(picks, startYear, { SEASONS }, seed, yourName = "Your XI") {
  const rng = createRng(seed);
  const results = [];
  const years = Object.keys(SEASONS).map(Number).sort((a, b) => a - b);
  for (let i = 0; i < 5; i++) {
    const year = startYear + i;
    // Use that year's data if present, else the closest available season's shape.
    const season = SEASONS[year] ||
      SEASONS[years.reduce((best, y) =>
        Math.abs(y - year) < Math.abs(best - year) ? y : best, years[0])];
    results.push(simulateSeason(picks, season, year, i, rng, yourName));
  }
  return results;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS — all simulate tests green.

- [ ] **Step 5: Commit**

```bash
git add src/engine/simulate.js test/simulate.test.js
git commit -m "feat: five-season simulation engine (insert-into-real-table)"
```

---

## Task 8: Draft state machine

**Files:**
- Create: `src/game/draft.js`
- Test: `test/draft.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRng } from "../src/engine/rng.js";
import {
  createDraft, spin, availableForOpenSlots, draftPlayer, isComplete, currentXI,
} from "../src/game/draft.js";
import { SQUADS } from "../src/data/squads.js";

const combos = [["LOG", 1994], ["ALB", 1994], ["LOG", 1995], ["ALB", 1995]];

test("a fresh draft has 11 open slots and is not complete", () => {
  const d = createDraft(createRng(1));
  assert.equal(d.picks.length, 0);
  assert.equal(isComplete(d), false);
});

test("spin returns a club+year from the combo pool", () => {
  const d = createDraft(createRng(1));
  const { club, year } = spin(d, combos);
  assert.ok(combos.some(([c, y]) => c === club && y === year));
});

test("availableForOpenSlots only lists players eligible for an open slot", () => {
  const d = createDraft(createRng(1));
  const list = availableForOpenSlots(d, SQUADS, "LOG", 1994);
  assert.ok(list.length > 0);
});

test("drafting a player fills a slot and removes that slot from open", () => {
  const d = createDraft(createRng(1));
  const gk = SQUADS["LOG|1994"].find(p => p.positions.includes("GK"));
  const d2 = draftPlayer(d, { club: "LOG", year: 1994, player: gk }, "GK");
  assert.equal(d2.picks.length, 1);
  assert.equal(d2.picks[0].slotId, "GK");
});

test("cannot draft the same player twice", () => {
  const d = createDraft(createRng(1));
  const gk = SQUADS["LOG|1994"].find(p => p.positions.includes("GK"));
  const d2 = draftPlayer(d, { club: "LOG", year: 1994, player: gk }, "GK");
  assert.throws(() => draftPlayer(d2, { club: "LOG", year: 1994, player: gk }, "GK"));
});

test("currentXI returns picks usable by the engine", () => {
  const d = createDraft(createRng(1));
  const gk = SQUADS["LOG|1994"].find(p => p.positions.includes("GK"));
  const d2 = draftPlayer(d, { club: "LOG", year: 1994, player: gk }, "GK");
  const xi = currentXI(d2);
  assert.equal(xi[0].slotId, "GK");
  assert.equal(xi[0].player.name, gk.name);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `src/game/draft.js`**

```js
import { FORMATION_442, openSlots, positionFit } from "./formation.js";
import { randInt } from "../engine/rng.js";

export function createDraft(rng) {
  return { rng, picks: [], draftedKeys: new Set() };
}

function filledIds(draft) {
  return draft.picks.map(p => p.slotId);
}

// Pick a random [club, year] from the combo pool.
export function spin(draft, combos) {
  const [club, year] = combos[randInt(draft.rng, 0, combos.length - 1)];
  return { club, year };
}

// Players from this squad eligible for at least one currently-open slot,
// excluding already-drafted players. Sorted best-fit then overall.
export function availableForOpenSlots(draft, SQUADS, club, year) {
  const squad = SQUADS[`${club}|${year}`] || [];
  const open = openSlots(filledIds(draft));
  const openRoles = new Set(open.map(s => s.role));
  return squad
    .filter(pl => !draft.draftedKeys.has(playerKey(club, year, pl)))
    .map(pl => {
      const bestFit = Math.max(...[...openRoles].map(r => positionFit(pl.positions, r)));
      return { player: pl, bestFit };
    })
    .filter(x => x.bestFit > 0.4) // only show players that fit an open slot reasonably
    .sort((a, b) => b.bestFit - a.bestFit || b.player.overall - a.player.overall)
    .map(x => x.player);
}

function playerKey(club, year, player) {
  return `${club}|${year}|${player.name}`;
}

// Draft a player into a specific open slot. Returns a new draft state.
export function draftPlayer(draft, { club, year, player }, slotId) {
  const slot = FORMATION_442.find(s => s.id === slotId);
  if (!slot) throw new Error(`unknown slot ${slotId}`);
  if (filledIds(draft).includes(slotId)) throw new Error(`slot ${slotId} already filled`);
  const key = playerKey(club, year, player);
  if (draft.draftedKeys.has(key)) throw new Error(`player already drafted: ${key}`);
  const picks = [...draft.picks, { slotId, club, year, player }];
  const draftedKeys = new Set(draft.draftedKeys);
  draftedKeys.add(key);
  return { ...draft, picks, draftedKeys };
}

export function isComplete(draft) {
  return draft.picks.length === FORMATION_442.length;
}

// Picks in engine-ready shape (already are: {slotId, club, year, player}).
export function currentXI(draft) {
  return draft.picks;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/draft.js test/draft.test.js
git commit -m "feat: draft state machine (spin, draft, completion)"
```

---

## Task 9: Build the combos index + game-config module

**Files:**
- Create: `src/data/combos.js`
- Test: `test/combos.test.js`

The draft pool must only offer club+year pairs that actually have a squad.

- [ ] **Step 1: Write the failing test**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { COMBOS, YEAR_RANGE } from "../src/data/combos.js";
import { SQUADS } from "../src/data/squads.js";

test("every combo has a non-empty squad", () => {
  for (const [club, year] of COMBOS) {
    assert.ok(SQUADS[`${club}|${year}`]?.length >= 11, `${club}|${year}`);
  }
});

test("year range spans the design window bounds", () => {
  assert.equal(YEAR_RANGE.min, 1980);
  assert.equal(YEAR_RANGE.max, 2025);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `src/data/combos.js`**

```js
import { SQUADS } from "./squads.js";

// Draftable [club, year] pairs derived from whatever squads exist.
export const COMBOS = Object.keys(SQUADS).map(k => {
  const [club, year] = k.split("|");
  return [club, Number(year)];
});

// The start-year selector range from the design spec (1980–2025),
// independent of which squads are populated.
export const YEAR_RANGE = { min: 1980, max: 2025 };
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/combos.js test/combos.test.js
git commit -m "feat: derive draftable combos from squads"
```

---

## Task 10: UI — setup screen

**Files:**
- Create: `src/ui/setup.js`
- Modify: `styles.css` (append setup styles)

> UI tasks are verified in the browser, not unit-tested. Each render function takes a container element and an `onDone` callback.

- [ ] **Step 1: Implement `src/ui/setup.js`**

```js
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
```

- [ ] **Step 2: Append setup styles to `styles.css`**

```css
.screen { max-width: 520px; margin: 0 auto; padding: 32px 20px; }
.brand { font-size: 34px; font-weight: 900; text-align: center; margin: 8px 0; }
.brand span { color: #f5d040; }
.tagline { text-align: center; opacity: .6; margin-bottom: 28px; }
.field { display: block; margin: 14px 0; }
.field span { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: .6; margin-bottom: 6px; }
.field input { width: 100%; box-sizing: border-box; padding: 12px; font-size: 16px; border-radius: 10px; border: 1px solid #2a2a3a; background: #12121c; color: #fff; }
button.primary { width: 100%; margin-top: 18px; padding: 14px; font-size: 16px; font-weight: 800; border: none; border-radius: 10px; background: #f5d040; color: #1a1500; cursor: pointer; }
button.primary:disabled { opacity: .4; cursor: not-allowed; }
.hint { text-align: center; font-size: 12px; opacity: .5; margin-top: 12px; }
```

- [ ] **Step 3: Temporarily wire `app.js` to show the setup screen**

```js
import { renderSetup } from "./src/ui/setup.js";
const root = document.getElementById("app");
renderSetup(root, (cfg) => console.log("setup done", cfg));
```

- [ ] **Step 4: Verify in the browser**

Start the preview server (preview_start) on the project, load `index.html`. Confirm: the setup screen renders, the Start button is disabled until a name is typed, and clicking it logs `{ teamName, startYear }` to the console (preview_console_logs). Take a screenshot.

- [ ] **Step 5: Commit**

```bash
git add src/ui/setup.js styles.css app.js
git commit -m "feat: setup screen (team name + start year)"
```

---

## Task 11: UI — draft + pitch screen

**Files:**
- Create: `src/ui/draft.js`
- Modify: `styles.css` (append draft/pitch styles)

- [ ] **Step 1: Implement `src/ui/draft.js`**

```js
import { FORMATION_442, openSlots, positionFit } from "../game/formation.js";
import { CLUBS } from "../data/clubs.js";
import { spin, availableForOpenSlots, draftPlayer, isComplete } from "../game/draft.js";

// Renders the draft loop. onComplete(draftState) fires when the XI is full.
export function renderDraft(root, draftState, { SQUADS, COMBOS }, onComplete) {
  let draw = null; // current { club, year }

  function paint() {
    root.innerHTML = `
      <section class="screen draft">
        <div class="reels">
          <button id="spinBtn" class="primary">${draw ? "Re-spin" : "SPIN"}</button>
          <div class="draw">${draw ? `${CLUBS[draw.club].name} · ${draw.year}` : "Spin for a club & season"}</div>
        </div>
        <div class="draft-cols">
          <div class="player-list" id="playerList"></div>
          <div class="pitch" id="pitch"></div>
        </div>
        <div class="progress">${draftState.picks.length} / 11 drafted</div>
      </section>`;
    root.querySelector("#spinBtn").addEventListener("click", doSpin);
    paintPitch();
    paintList();
  }

  function doSpin() {
    draw = spin(draftState, COMBOS);
    paintList();
    root.querySelector(".draw").textContent = `${CLUBS[draw.club].name} · ${draw.year}`;
    root.querySelector("#spinBtn").textContent = "Re-spin";
  }

  function paintList() {
    const list = root.querySelector("#playerList");
    if (!draw) { list.innerHTML = `<p class="hint">Spin to see players.</p>`; return; }
    const players = availableForOpenSlots(draftState, SQUADS, draw.club, draw.year);
    if (!players.length) { list.innerHTML = `<p class="hint">No players here fit an open slot. Re-spin.</p>`; return; }
    list.innerHTML = players.map((pl, i) =>
      `<button class="player-row" data-i="${i}">
         <span class="pname">${pl.name}</span>
         <span class="ppos">${pl.positions.join("/")}</span>
       </button>`).join("");
    list.querySelectorAll(".player-row").forEach(btn => {
      btn.addEventListener("click", () => choosePlayer(players[Number(btn.dataset.i)]));
    });
  }

  // After choosing a player, place them in their best open slot.
  function choosePlayer(player) {
    const open = openSlots(draftState.picks.map(p => p.slotId));
    const slot = open
      .map(s => ({ s, fit: positionFit(player.positions, s.role) }))
      .sort((a, b) => b.fit - a.fit)[0].s;
    draftState = draftPlayer(draftState, { club: draw.club, year: draw.year, player }, slot.id);
    draw = null;
    if (isComplete(draftState)) { onComplete(draftState); return; }
    paint();
  }

  function paintPitch() {
    const pitch = root.querySelector("#pitch");
    pitch.innerHTML = FORMATION_442.map(slot => {
      const pick = draftState.picks.find(p => p.slotId === slot.id);
      return `<div class="slot ${pick ? "filled" : ""}" style="left:${slot.x}%; top:${slot.y}%">
        <span class="slot-role">${slot.role}</span>
        <span class="slot-name">${pick ? pick.player.name : ""}</span>
      </div>`;
    }).join("");
  }

  paint();
}
```

- [ ] **Step 2: Append draft/pitch styles to `styles.css`**

```css
.reels { text-align: center; margin-bottom: 16px; }
.reels .draw { margin-top: 10px; font-weight: 700; opacity: .85; }
.draft-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.player-list { display: flex; flex-direction: column; gap: 6px; max-height: 60vh; overflow:auto; }
.player-row { display: flex; justify-content: space-between; padding: 10px 12px; border: 1px solid #2a2a3a; border-radius: 8px; background: #12121c; color: #eee; cursor: pointer; text-align: left; }
.player-row:hover { border-color: #f5d040; }
.ppos { opacity: .5; font-size: 12px; }
.pitch { position: relative; background: linear-gradient(#13391f,#0e2c18); border-radius: 12px; aspect-ratio: 2/3; }
.slot { position: absolute; transform: translate(-50%,-50%); width: 64px; text-align: center; }
.slot-role { display:block; font-size:10px; opacity:.6; }
.slot-name { display:block; font-size:11px; font-weight:700; min-height: 14px; }
.slot.filled .slot-role { color: #f5d040; }
.progress { text-align: center; margin-top: 14px; font-weight: 700; }
```

- [ ] **Step 3: Temporarily wire `app.js` setup → draft**

```js
import { renderSetup } from "./src/ui/setup.js";
import { renderDraft } from "./src/ui/draft.js";
import { createDraft } from "./src/game/draft.js";
import { createRng } from "./src/engine/rng.js";
import { SQUADS } from "./src/data/squads.js";
import { COMBOS } from "./src/data/combos.js";

const root = document.getElementById("app");
renderSetup(root, ({ teamName, startYear }) => {
  const draft = createDraft(createRng(12345));
  renderDraft(root, draft, { SQUADS, COMBOS }, (finished) => {
    console.log("XI complete", finished.picks);
  });
});
```

- [ ] **Step 4: Verify in the browser**

Reload. Click through: enter a name → Start → Spin → pick a player → watch the pitch fill and the open slots shrink → repeat to 11. Confirm "11 / 11" then `XI complete` logs the picks (preview_console_logs). Screenshot a partially-filled pitch.

- [ ] **Step 5: Commit**

```bash
git add src/ui/draft.js styles.css app.js
git commit -m "feat: draft + pitch screen"
```

---

## Task 12: UI — results screen (season-by-season)

**Files:**
- Create: `src/ui/results.js`
- Modify: `styles.css` (append results styles)

- [ ] **Step 1: Implement `src/ui/results.js`**

```js
import { CLUBS } from "../data/clubs.js";

// Renders the season-by-season results. `seasons` is the SeasonResult[] from
// simulateFiveYears; teamName is the player's club name.
export function renderResults(root, seasons, teamName, onAgain) {
  let idx = 0;

  function clubName(row) {
    return row.isYou ? teamName : (CLUBS[row.club]?.name || row.club);
  }

  function ordinal(n) {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function paint() {
    const r = seasons[idx];
    const rec = r.record;
    root.innerHTML = `
      <section class="screen results">
        <div class="rs-nav">
          <button id="prev" ${idx === 0 ? "disabled" : ""}>◀</button>
          <div class="rs-title">
            <b>${r.year} / ${(r.year + 1) % 100}</b>
            <small>${teamName.toUpperCase()} · SEASON ${idx + 1} OF 5</small>
          </div>
          <button id="next" ${idx === seasons.length - 1 ? "disabled" : ""}>▶</button>
        </div>
        <div class="rs-dots">${seasons.map((_, i) =>
          `<i class="${i === idx ? "on" : ""}"></i>`).join("")}</div>

        <div class="rs-banner">
          <div class="rs-rank">${ordinal(r.position)}</div>
          <div class="rs-rec">
            <b>${teamName}</b><br>
            P${rec.P} · ${rec.W}W ${rec.D}D ${rec.L}L · ${rec.GF}–${rec.GA} · <b>${rec.Pts} pts</b>
          </div>
        </div>

        <div class="rs-grid">
          <div>
            <div class="rs-h">Final table</div>
            <table class="rs-tbl">${r.table.map((row, i) =>
              `<tr class="${row.isYou ? "me" : ""}"><td class="p">${i + 1}</td>
               <td>${clubName(row)}</td><td class="pts">${row.pts}</td></tr>`).join("")}
            </table>
          </div>
          <div>
            <div class="rs-h">Top scorers</div>
            <table class="rs-sc">${r.topScorers.map(s =>
              `<tr class="${s.isYou ? "me" : ""}"><td>${s.name}<div class="cl">${s.isYou ? teamName : (CLUBS[s.club]?.name || s.club)}</div></td>
               <td class="g">${s.goals}</td></tr>`).join("")}
            </table>
            <div class="rs-h" style="margin-top:12px">Honours</div>
            <div class="rs-hon">${r.honours.length ? r.honours.map(h => `🏆 ${h}`).join("<br>") : "—"}</div>
          </div>
        </div>

        <button id="again" class="primary">Build another XI</button>
      </section>`;

    root.querySelector("#prev").addEventListener("click", () => { if (idx > 0) { idx--; paint(); } });
    root.querySelector("#next").addEventListener("click", () => { if (idx < seasons.length - 1) { idx++; paint(); } });
    root.querySelector("#again").addEventListener("click", onAgain);
  }
  paint();
}
```

- [ ] **Step 2: Append results styles to `styles.css`**

```css
.rs-nav { display:flex; align-items:center; justify-content:space-between; margin-bottom: 10px; }
.rs-nav button { width:38px; height:38px; border-radius:8px; border:1px solid #2a2a3a; background:#1d1d2b; color:#fff; font-size:16px; cursor:pointer; }
.rs-nav button:disabled { opacity:.3; cursor:default; }
.rs-title { text-align:center; }
.rs-title b { font-size:20px; display:block; }
.rs-title small { font-size:10px; opacity:.5; letter-spacing:1px; }
.rs-dots { display:flex; gap:5px; justify-content:center; margin: 8px 0 14px; }
.rs-dots i { width:7px; height:7px; border-radius:50%; background:#2c2c3c; }
.rs-dots i.on { background:#f5d040; width:18px; border-radius:4px; }
.rs-banner { display:flex; align-items:center; gap:14px; background:#1a241a; border:1px solid #2f4a2f; border-radius:12px; padding:12px 14px; margin-bottom:14px; }
.rs-rank { font-size:30px; font-weight:900; color:#9be29b; }
.rs-rec { font-size:12px; opacity:.85; line-height:1.5; }
.rs-grid { display:grid; grid-template-columns: 1.3fr 1fr; gap:14px; }
.rs-h { font-size:10px; letter-spacing:1.5px; text-transform:uppercase; opacity:.5; margin-bottom:6px; }
.rs-tbl, .rs-sc { width:100%; font-size:12px; border-collapse:collapse; }
.rs-tbl td, .rs-sc td { padding:3px 5px; border-bottom:1px solid #20202c; }
.rs-tbl .p { opacity:.45; width:18px; }
.rs-tbl .pts, .rs-sc .g { text-align:right; font-weight:700; }
.rs-sc .g { color:#f5d040; }
.rs-sc .cl { opacity:.45; font-size:10px; }
tr.me td { background:#1d2a1d; color:#9be29b; font-weight:700; }
.rs-hon { font-size:12px; opacity:.85; }
.results .primary { margin-top:18px; }
```

- [ ] **Step 3: Temporarily wire `app.js` to show results with a stub XI**

```js
// Append to existing app.js imports:
import { renderResults } from "./src/ui/results.js";
import { simulateFiveYears } from "./src/engine/simulate.js";
import { SEASONS } from "./src/data/seasons.js";

// Replace the "XI complete" callback body in renderDraft with:
//   const seasons = simulateFiveYears(finished.picks, startYear, { SEASONS }, 12345, teamName);
//   renderResults(root, seasons, teamName, () => location.reload());
```

- [ ] **Step 4: Verify in the browser**

Reload, play through to a full XI. Confirm the results screen renders: position banner, final table with your club highlighted among real clubs (length = division size), top scorers (your striker may appear), honours, and ◀ ▶ moving through all 5 seasons with the dots tracking. Screenshot season 1 and season 5.

- [ ] **Step 5: Commit**

```bash
git add src/ui/results.js styles.css app.js
git commit -m "feat: season-by-season results screen"
```

---

## Task 13: Final app wiring + full playthrough

**Files:**
- Modify: `app.js` (clean orchestration, remove temporary console logs)

- [ ] **Step 1: Replace `app.js` with the final orchestrator**

```js
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
```

- [ ] **Step 2: Run the unit suite once more**

Run: `npm test`
Expected: PASS — all logic modules green.

- [ ] **Step 3: Full browser playthrough**

Reload. Complete a full game: name → year → draft 11 → results → "Build another XI" returns to setup. Confirm no console errors (preview_console_logs) and the disclaimer footer shows on every screen. Screenshot the completed results.

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: wire setup → draft → simulate → results flow"
```

---

## Self-Review (completed by plan author)

**Spec coverage:**
- Core loop (name → year → draft → simulate → results): Tasks 7, 8, 10, 11, 12, 13 ✓
- Spin-per-player draft mechanic: Task 8, 11 ✓
- Single fixed 4-4-2 formation: Task 3 ✓
- Single mode (stats hidden, blank): draft list shows name + positions only (Task 11) ✓
- Insert-into-real-table engine: Task 7 ✓
- Aging + variance + era-strength opponents: Tasks 5, 7 ✓
- Era-accurate division size: `divisionSize` per season (Task 6), table trimmed to it (Task 7) ✓
- Season-by-season results (option B: table, top scorers, honours, record, nav): Task 12 ✓
- Team name only, no crest/colours: Task 10 ✓
- Small real sample (ALB/LOG mid-90s): Task 6 ✓
- Vanilla HTML/CSS/JS, no build step: throughout ✓
- Copa del Rey honours from strength: Task 7 ✓
- Disclaimer present: Task 1 (footer) ✓
- Out-of-scope items (ads/IAP/SEO/multi-formation/full dataset): deferred to a follow-up plan, noted at top ✓

**Placeholder scan:** No "TBD"/"implement later" steps; every code step contains complete code. The sample data is flagged as "verify before launch," but the code is concrete and runnable.

**Type consistency:** Pick shape `{slotId, club, year, player}` is consistent across draft.js (Task 8), strength.js (Task 4), simulate.js (Task 7). `SeasonResult` fields (`year, position, record, honours, table, topScorers`) used identically in Task 7 and Task 12. `Record` fields (`P,W,D,L,GF,GA,Pts`) consistent in Task 7 and Task 12. `season.finalTable[].{club,pts}` and `topScorers[].{name,club,goals}` consistent across Tasks 6, 7, 12. Function names (`createRng`, `teamStrength`, `projectedOverall`, `projectedPoints`, `insertIntoTable`, `simulateFiveYears`, `createDraft`, `spin`, `availableForOpenSlots`, `draftPlayer`, `isComplete`, `currentXI`, `openSlots`, `positionFit`, `FORMATION_442`) consistent between definitions and call sites.
