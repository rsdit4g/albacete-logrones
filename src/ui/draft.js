import { openSlots } from "../game/formation.js?v=13";
import { CLUBS } from "../data/clubs.js?v=16";
import { spin, allPlayersForSquad, draftPlayer, isComplete } from "../game/draft.js?v=13";
import { pitchSlotsHTML } from "./pitch.js?v=2";
import { randInt } from "../engine/rng.js";

const SEED_COUNT = 4;
const POS_ORDER = { GK: 0, DF: 1, MF: 2, AT: 3 };

const MAX_RESPINS = 2; // re-rolls ("volver a girar") allowed in the whole game

export function renderDraft(root, startClub, startYear, draftState, { SQUADS, COMBOS, mode }, onComplete) {
  let draw = null;
  let spinning = false;
  let reSpinsUsed = 0;

  const maldiniano = mode === "maldiniano";     // hide player stats, show name + pos only
  const pickAll    = mode === "miequipo";        // pick all 11 from the start squad, no roulette
  const auto       = mode === "miequipo-random"; // roulette auto-picks the whole 11

  // "Seed" = picking by hand from the starting squad. In Mi Equipo that's the
  // whole game (all 11 slots); in the auto mode there's no manual phase at all.
  const seedCount = pickAll ? 11 : SEED_COUNT;
  const inSeed = () => !auto && draftState.picks.length < seedCount;
  const clubName = (c) => CLUBS[c]?.name || c;
  const reSpinsLeft = () => MAX_RESPINS - reSpinsUsed;

  // Button label/state: "GIRAR" for a fresh pick, "VOLVER A GIRAR · N" while a
  // draw is showing, disabled once both re-rolls are spent. In auto mode every
  // press just fires the next pick, so there's no re-roll bookkeeping.
  function spinBtnText() {
    if (auto) return spinning ? "GIRANDO…" : "GIRAR";
    if (!draw) return "GIRAR";
    const n = reSpinsLeft();
    return n > 0 ? `VOLVER A GIRAR · ${n} ${n === 1 ? "restante" : "restantes"}` : "SIN GIROS EXTRA";
  }
  function spinDisabled() {
    if (auto) return spinning;
    return spinning || (!!draw && reSpinsLeft() <= 0);
  }
  function refreshSpinBtn() {
    const btn = root.querySelector("#spinBtn");
    if (!btn) return;
    btn.textContent = spinBtnText();
    btn.disabled = spinDisabled();
  }

  function headHTML() {
    if (pickAll) {
      return `<div class="dh-title">Monta tu once · <b>${clubName(startClub)}</b> <span class="dh-year">${startYear}</span></div>
              <div class="dh-sub">Tu once — ${draftState.picks.length}/11 elegidos</div>`;
    }
    if (inSeed()) {
      return `<div class="dh-title">Elige ${SEED_COUNT} de <b>${clubName(startClub)}</b> <span class="dh-year">${startYear}</span></div>
              <div class="dh-sub">Tu base — ${draftState.picks.length}/${SEED_COUNT} elegidos</div>`;
    }
    if (auto) {
      return `<div class="dh-title">La ruleta monta tu once</div>
              <div class="dh-sub">${draftState.picks.length}/11 fichados · ${11 - draftState.picks.length} por fichar</div>`;
    }
    return `<div class="dh-title">Gira por el resto</div>
            <div class="dh-sub">${draftState.picks.length}/11 fichados · ${11 - draftState.picks.length} por fichar</div>`;
  }

  function paint() {
    const seed = inSeed();
    root.innerHTML = `
      <section class="screen draft">
        <div class="draft-head">${headHTML()}</div>
        ${seed ? "" : `
          <div class="reels" id="reels">
            <div class="reel" id="reelClub"><span class="reel-label">CLUB</span><span class="reel-val" id="reelClubVal">${draw ? clubName(draw.club) : "—"}</span></div>
            <div class="reel" id="reelYear"><span class="reel-label">TEMPORADA</span><span class="reel-val" id="reelYearVal">${draw ? draw.year : "—"}</span></div>
          </div>
          <button class="primary spin-btn" id="spinBtn" ${spinDisabled() ? "disabled" : ""}>${spinBtnText()}</button>
          ${auto
            ? `<div class="respin-hint">La ruleta elige por ti · tú solo giras</div>`
            : `<div class="respin-hint">Solo puedes volver a girar <b>${MAX_RESPINS}</b> veces en toda la partida · te quedan <b>${reSpinsLeft()}</b></div>`}`}
        <div class="draft-cols">
          <div class="player-list" id="playerList"></div>
          <div class="pitch" id="pitch"></div>
        </div>
      </section>`;
    if (!seed) root.querySelector("#spinBtn").addEventListener("click", doSpin);
    paintPitch();
    paintList();
  }

  function paintList() {
    const list = root.querySelector("#playerList");

    // Auto mode never offers a manual choice — just a running status line.
    if (auto) {
      list.innerHTML = `<p class="hint">Pulsa <b>GIRAR</b> y la ruleta sorteará un club, una temporada y un jugador para tu once. ${draftState.picks.length}/11 fichados.</p>`;
      return;
    }

    let club, year;
    if (inSeed()) { club = startClub; year = startYear; }
    else if (draw) { club = draw.club; year = draw.year; }
    else { list.innerHTML = `<p class="hint">Gira para sortear club y temporada.</p>`; return; }

    const players = allPlayersForSquad(draftState, SQUADS, club, year)
      .sort((a, b) => {
        // Available players first, then by position. The within-position tiebreak
        // is media (best first) in Clásico, but alphabetical in Maldiniano so the
        // ordering doesn't leak quality when stats are hidden.
        if (a.available !== b.available) return a.available ? -1 : 1;
        const byPos = POS_ORDER[a.pos] - POS_ORDER[b.pos];
        if (byPos) return byPos;
        return maldiniano ? a.name.localeCompare(b.name) : (b.media - a.media);
      });

    if (!players.length) {
      list.innerHTML = `<p class="hint">No quedan jugadores disponibles.${inSeed() ? "" : " Vuelve a girar."}</p>`;
      return;
    }

    // Maldiniano mode hides all stat columns — only Nombre + Pos.
    const COLS = maldiniano ? "1fr 80px" : "1fr 52px 40px 34px 34px 34px 34px 46px";
    const header = maldiniano
      ? `<span>Nombre</span><span>Pos</span>`
      : `<span>Nombre</span><span>Pos</span><span class="age-th">Edad</span><span>Vel</span><span>Res</span><span>Agr</span><span>Cal</span><span class="media-th">Media</span>`;
    const statCells = (pl) => maldiniano ? "" : `
            <span class="pr-stat pr-age">${pl.age}</span>
            <span class="pr-stat">${pl.velocidad}</span>
            <span class="pr-stat">${pl.resistencia}</span>
            <span class="pr-stat">${pl.agresividad}</span>
            <span class="pr-stat">${pl.calidad}</span>
            <span class="pr-stat pr-media">${pl.media}</span>`;

    list.innerHTML = `
      <div class="player-table" role="table">
        <div class="pt-header" role="row" style="grid-template-columns:${COLS}">
          ${header}
        </div>
        ${players.map((pl, i) => `
          <div class="player-row${pl.available ? "" : " pr-disabled"}" role="row" data-i="${i}" style="grid-template-columns:${COLS}">
            <span class="pr-name">${pl.name}</span>
            <span class="pr-pos-cell"><span class="pr-pos pr-pos-${pl.pos}">${pl.pos}</span></span>${statCells(pl)}
          </div>`).join("")}
      </div>`;

    // Only clickable rows get an event listener — disabled rows are inert
    list.querySelectorAll(".player-row:not(.pr-disabled)").forEach(btn =>
      btn.addEventListener("click", () => choose(players[Number(btn.dataset.i)], club, year)));
  }

  function choose(player, club, year) {
    const open = openSlots(draftState.picks.map(p => p.slotId));
    // Strict: only place into a slot of the player's exact position.
    const slot = open.find(s => s.pos === player.pos);
    if (!slot) return; // no exact-position slot open — should be disabled anyway
    draftState = draftPlayer(draftState, { club, year, player }, slot.id);
    draw = null;
    if (isComplete(draftState)) { onComplete(draftState); return; }
    paint();
  }

  // Two-stage dramatic reel animation: club locks first, then year. Cosmetic
  // flicker uses Math.random; the real draw is supplied by the caller. Calls
  // done() once both reels have locked.
  function animateReels(target, done) {
    const clubEl = root.querySelector("#reelClubVal");
    const yearEl = root.querySelector("#reelYearVal");
    const btn = root.querySelector("#spinBtn");
    if (btn) btn.disabled = true;
    clubEl.parentElement.classList.remove("locked");
    yearEl.parentElement.classList.remove("locked");

    const clubNames = [...new Set(COMBOS.map(([c]) => clubName(c)))];
    const years = [...new Set(COMBOS.map(([, y]) => y))];

    clubEl.parentElement.classList.add("spinning");
    const clubFlick = setInterval(() => {
      clubEl.textContent = clubNames[Math.floor(Math.random() * clubNames.length)];
    }, 70);

    setTimeout(() => {
      clearInterval(clubFlick);
      clubEl.textContent = clubName(target.club);
      clubEl.parentElement.classList.remove("spinning");
      clubEl.parentElement.classList.add("locked");

      yearEl.parentElement.classList.add("spinning");
      const yearFlick = setInterval(() => {
        yearEl.textContent = years[Math.floor(Math.random() * years.length)];
      }, 70);

      setTimeout(() => {
        clearInterval(yearFlick);
        yearEl.textContent = target.year;
        yearEl.parentElement.classList.remove("spinning");
        yearEl.parentElement.classList.add("locked");
        done();
      }, 850);
    }, 1050);
  }

  function doSpin() {
    if (spinning) return;
    if (auto) { doAutoSpin(); return; }

    // A spin while a draw is already showing is a re-roll — limited to MAX_RESPINS.
    const isReroll = draw !== null;
    if (isReroll && reSpinsLeft() <= 0) return;
    if (isReroll) reSpinsUsed++;
    spinning = true;
    draw = spin(draftState, COMBOS);

    animateReels(draw, () => {
      spinning = false;
      refreshSpinBtn();
      // Update the "te quedan N" hint after a re-roll is consumed.
      const hint = root.querySelector(".respin-hint");
      if (hint) hint.innerHTML = `Solo puedes volver a girar <b>${MAX_RESPINS}</b> veces en toda la partida · te quedan <b>${reSpinsLeft()}</b>`;
      paintList();
    });
  }

  // Find a random [club, year] whose squad still has at least one player fitting
  // an open slot, so the roulette never lands on a dead end. Returns the draw and
  // the eligible candidate players.
  function drawWithFit() {
    const openPos = new Set(openSlots(draftState.picks.map(p => p.slotId)).map(s => s.pos));
    for (let i = 0; i < 200; i++) {
      const d = spin(draftState, COMBOS);
      const cands = allPlayersForSquad(draftState, SQUADS, d.club, d.year)
        .filter(p => openPos.has(p.pos));
      if (cands.length) return { draw: d, cands };
    }
    return null;
  }

  // Mi Equipo Random: spin, then the roulette itself picks one fitting player.
  function doAutoSpin() {
    const picked = drawWithFit();
    if (!picked) return; // every squad has all lines, so this is effectively unreachable
    draw = picked.draw;
    spinning = true;
    refreshSpinBtn();

    animateReels(draw, () => {
      const open = openSlots(draftState.picks.map(p => p.slotId));
      const player = picked.cands[randInt(draftState.rng, 0, picked.cands.length - 1)];
      const slot = open.find(s => s.pos === player.pos);
      draftState = draftPlayer(draftState, { club: draw.club, year: draw.year, player }, slot.id);
      spinning = false;
      draw = null;
      if (isComplete(draftState)) { onComplete(draftState); return; }
      paint();
    });
  }

  function paintPitch() {
    const pitch = root.querySelector("#pitch");
    pitch.innerHTML = pitchSlotsHTML(draftState.picks);
  }

  paint();
}
