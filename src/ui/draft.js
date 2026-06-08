import { FORMATION_442, openSlots, positionFit } from "../game/formation.js";
import { CLUBS } from "../data/clubs.js";
import { spin, availableForOpenSlots, draftPlayer, isComplete } from "../game/draft.js";

const SEED_COUNT = 4; // players chosen from your own club before spinning

// Renders the draft: first pick SEED_COUNT players from your club, then spin
// (dramatic two-stage reel) for the remaining slots. onComplete(draftState) fires
// when the XI is full. `draftState` is created by the caller with a seeded rng.
export function renderDraft(root, startClub, startYear, draftState, { SQUADS, COMBOS }, onComplete) {
  let draw = null;        // current spin result { club, year }
  let spinning = false;

  const inSeed = () => draftState.picks.length < SEED_COUNT;
  const clubName = (c) => CLUBS[c]?.name || c;

  function paint() {
    const seed = inSeed();
    root.innerHTML = `
      <section class="screen draft">
        <div class="draft-head">
          ${seed
            ? `<div class="dh-title">Pick ${SEED_COUNT} from <b>${clubName(startClub)}</b> <span class="dh-year">${startYear}</span></div>
               <div class="dh-sub">Your foundation — ${draftState.picks.length}/${SEED_COUNT} chosen</div>`
            : `<div class="dh-title">Spin for the rest</div>
               <div class="dh-sub">${draftState.picks.length}/11 drafted · ${11 - draftState.picks.length} to go</div>`}
        </div>
        ${seed ? "" : `
          <div class="reels" id="reels">
            <div class="reel" id="reelClub"><span class="reel-label">CLUB</span><span class="reel-val" id="reelClubVal">${draw ? clubName(draw.club) : "—"}</span></div>
            <div class="reel" id="reelYear"><span class="reel-label">SEASON</span><span class="reel-val" id="reelYearVal">${draw ? draw.year : "—"}</span></div>
          </div>
          <button class="primary spin-btn" id="spinBtn">${draw ? "Re-spin" : "SPIN"}</button>`}
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
    else { list.innerHTML = `<p class="hint">Spin to draw a club &amp; season.</p>`; return; }

    const players = availableForOpenSlots(draftState, SQUADS, club, year);
    if (!players.length) {
      list.innerHTML = `<p class="hint">No players here fit an open slot.${inSeed() ? "" : " Re-spin."}</p>`;
      return;
    }
    list.innerHTML = players.map((pl, i) => `
      <button class="player-row" data-i="${i}">
        <span class="pr-pos pr-pos-${pl.pos}">${pl.pos}</span>
        <span class="pr-name">${pl.name}</span>
        <span class="pr-media">${pl.media}</span>
      </button>`).join("");
    list.querySelectorAll(".player-row").forEach(btn =>
      btn.addEventListener("click", () => choose(players[Number(btn.dataset.i)], club, year)));
  }

  function choose(player, club, year) {
    const open = openSlots(draftState.picks.map(p => p.slotId));
    const slot = open
      .map(s => ({ s, fit: positionFit(player.pos, s.pos) }))
      .sort((a, b) => b.fit - a.fit)[0].s;
    draftState = draftPlayer(draftState, { club, year, player }, slot.id);
    draw = null;
    if (isComplete(draftState)) { onComplete(draftState); return; }
    paint();
  }

  // Two-stage dramatic spin: the club reel flickers and locks, then the year reel.
  // NOTE: the flicker uses Math.random for *display only* — the actual draw comes
  // from spin() on the seeded rng, so game outcomes stay deterministic.
  function doSpin() {
    if (spinning) return;
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
        btn.disabled = false;
        btn.textContent = "Re-spin";
        paintList();
      }, 850);
    }, 1050);
  }

  function paintPitch() {
    const pitch = root.querySelector("#pitch");
    pitch.innerHTML = FORMATION_442.map(slot => {
      const pick = draftState.picks.find(p => p.slotId === slot.id);
      return `<div class="slot ${pick ? "filled" : ""}" style="left:${slot.x}%; top:${slot.y}%">
        <span class="slot-pos">${slot.pos}</span>
        <span class="slot-name">${pick ? pick.player.name : ""}</span>
      </div>`;
    }).join("");
  }

  paint();
}
