import { FORMATION_442, openSlots } from "../game/formation.js?v=13";
import { CLUBS } from "../data/clubs.js?v=16";
import { spin, allPlayersForSquad, draftPlayer, isComplete } from "../game/draft.js?v=13";

const SEED_COUNT = 4;
const POS_ORDER = { GK: 0, DF: 1, MF: 2, AT: 3 };

const MAX_RESPINS = 2; // re-rolls ("volver a girar") allowed in the whole game

export function renderDraft(root, startClub, startYear, draftState, { SQUADS, COMBOS, mode }, onComplete) {
  let draw = null;
  let spinning = false;
  let reSpinsUsed = 0;
  const maldiniano = mode === "maldiniano"; // hide player stats, show name + pos only

  const inSeed = () => draftState.picks.length < SEED_COUNT;
  const clubName = (c) => CLUBS[c]?.name || c;
  const clubAbbr = (c) => CLUBS[c]?.abbr || c.slice(0, 3).toUpperCase();
  const yy = (year) => `'${String(year % 100).padStart(2, "0")}`;
  const reSpinsLeft = () => MAX_RESPINS - reSpinsUsed;

  // Button label/state: "GIRAR" for a fresh pick, "VOLVER A GIRAR · N" while a
  // draw is showing, disabled once both re-rolls are spent.
  function spinBtnText() {
    if (!draw) return "GIRAR";
    const n = reSpinsLeft();
    return n > 0 ? `VOLVER A GIRAR · ${n} ${n === 1 ? "restante" : "restantes"}` : "SIN GIROS EXTRA";
  }
  function spinDisabled() {
    return spinning || (!!draw && reSpinsLeft() <= 0);
  }
  function refreshSpinBtn() {
    const btn = root.querySelector("#spinBtn");
    if (!btn) return;
    btn.textContent = spinBtnText();
    btn.disabled = spinDisabled();
  }

  function paint() {
    const seed = inSeed();
    root.innerHTML = `
      <section class="screen draft">
        <div class="draft-head">
          ${seed
            ? `<div class="dh-title">Elige ${SEED_COUNT} de <b>${clubName(startClub)}</b> <span class="dh-year">${startYear}</span></div>
               <div class="dh-sub">Tu base — ${draftState.picks.length}/${SEED_COUNT} elegidos</div>`
            : `<div class="dh-title">Gira por el resto</div>
               <div class="dh-sub">${draftState.picks.length}/11 fichados · ${11 - draftState.picks.length} por fichar</div>`}
        </div>
        ${seed ? "" : `
          <div class="reels" id="reels">
            <div class="reel" id="reelClub"><span class="reel-label">CLUB</span><span class="reel-val" id="reelClubVal">${draw ? clubName(draw.club) : "—"}</span></div>
            <div class="reel" id="reelYear"><span class="reel-label">TEMPORADA</span><span class="reel-val" id="reelYearVal">${draw ? draw.year : "—"}</span></div>
          </div>
          <button class="primary spin-btn" id="spinBtn" ${spinDisabled() ? "disabled" : ""}>${spinBtnText()}</button>
          <div class="respin-hint">Solo puedes volver a girar <b>${MAX_RESPINS}</b> veces en toda la partida · te quedan <b>${reSpinsLeft()}</b></div>`}
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
    const COLS = maldiniano ? "1fr 80px" : "1fr 52px 34px 34px 34px 34px 46px";
    const header = maldiniano
      ? `<span>Nombre</span><span>Pos</span>`
      : `<span>Nombre</span><span>Pos</span><span>Vel</span><span>Res</span><span>Agr</span><span>Cal</span><span class="media-th">Media</span>`;
    const statCells = (pl) => maldiniano ? "" : `
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

  // Two-stage dramatic spin: club reel locks first, then year.
  // Cosmetic flicker uses Math.random; actual draw comes from seeded rng.
  function doSpin() {
    if (spinning) return;
    // A spin while a draw is already showing is a re-roll — limited to MAX_RESPINS.
    const isReroll = draw !== null;
    if (isReroll && reSpinsLeft() <= 0) return;
    if (isReroll) reSpinsUsed++;
    spinning = true;
    draw = spin(draftState, COMBOS);

    const clubEl = root.querySelector("#reelClubVal");
    const yearEl = root.querySelector("#reelYearVal");
    const btn = root.querySelector("#spinBtn");
    btn.disabled = true;
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
      clubEl.textContent = clubName(draw.club);
      clubEl.parentElement.classList.remove("spinning");
      clubEl.parentElement.classList.add("locked");

      yearEl.parentElement.classList.add("spinning");
      const yearFlick = setInterval(() => {
        yearEl.textContent = years[Math.floor(Math.random() * years.length)];
      }, 70);

      setTimeout(() => {
        clearInterval(yearFlick);
        yearEl.textContent = draw.year;
        yearEl.parentElement.classList.remove("spinning");
        yearEl.parentElement.classList.add("locked");
        spinning = false;
        refreshSpinBtn();
        // Update the "te quedan N" hint after a re-roll is consumed.
        const hint = root.querySelector(".respin-hint");
        if (hint) hint.innerHTML = `Solo puedes volver a girar <b>${MAX_RESPINS}</b> veces en toda la partida · te quedan <b>${reSpinsLeft()}</b>`;
        paintList();
      }, 850);
    }, 1050);
  }

  function paintPitch() {
    const pitch = root.querySelector("#pitch");
    // FIFA standard dimensions: 68m wide × 105m tall → viewBox="0 0 68 105"
    const pitchSVG = `<svg viewBox="0 0 68 105" preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0.45">
      <!-- Halfway line -->
      <line x1="0" y1="52.5" x2="68" y2="52.5" stroke="white" stroke-width="0.7"/>
      <!-- Center circle + spot -->
      <circle cx="34" cy="52.5" r="9.15" fill="none" stroke="white" stroke-width="0.7"/>
      <circle cx="34" cy="52.5" r="0.8" fill="white"/>
      <!-- Top penalty area -->
      <rect x="13.84" y="0" width="40.32" height="16.5" fill="none" stroke="white" stroke-width="0.7"/>
      <!-- Top 6-yard box -->
      <rect x="24.84" y="0" width="18.32" height="5.5" fill="none" stroke="white" stroke-width="0.7"/>
      <!-- Top penalty spot -->
      <circle cx="34" cy="11" r="0.8" fill="white"/>
      <!-- Top penalty arc (bulges into pitch) -->
      <path d="M 26.69 16.5 A 9.15 9.15 0 0 1 41.31 16.5" fill="none" stroke="white" stroke-width="0.7"/>
      <!-- Bottom penalty area -->
      <rect x="13.84" y="88.5" width="40.32" height="16.5" fill="none" stroke="white" stroke-width="0.7"/>
      <!-- Bottom 6-yard box -->
      <rect x="24.84" y="99.5" width="18.32" height="5.5" fill="none" stroke="white" stroke-width="0.7"/>
      <!-- Bottom penalty spot -->
      <circle cx="34" cy="94" r="0.8" fill="white"/>
      <!-- Bottom penalty arc (bulges into pitch) -->
      <path d="M 26.69 88.5 A 9.15 9.15 0 0 0 41.31 88.5" fill="none" stroke="white" stroke-width="0.7"/>
      <!-- Corner arcs (r=2.5 SVG units ≈ 1m) -->
      <path d="M 0 2.5 A 2.5 2.5 0 0 1 2.5 0" fill="none" stroke="white" stroke-width="0.7"/>
      <path d="M 65.5 0 A 2.5 2.5 0 0 1 68 2.5" fill="none" stroke="white" stroke-width="0.7"/>
      <path d="M 68 102.5 A 2.5 2.5 0 0 1 65.5 105" fill="none" stroke="white" stroke-width="0.7"/>
      <path d="M 2.5 105 A 2.5 2.5 0 0 1 0 102.5" fill="none" stroke="white" stroke-width="0.7"/>
    </svg>`;

    const slots = FORMATION_442.map(slot => {
      const pick = draftState.picks.find(p => p.slotId === slot.id);
      return `<div class="slot ${pick ? "filled" : ""}" style="left:${slot.x}%; top:${slot.y}%">
        <span class="slot-pos">${slot.pos}</span>
        <span class="slot-name">${pick ? pick.player.name : ""}</span>
        <span class="slot-team">${pick ? `${clubAbbr(pick.club)} ${yy(pick.year)}` : ""}</span>
      </div>`;
    }).join("");

    pitch.innerHTML = pitchSVG + slots;
  }

  paint();
}
