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
