import { CLUBS } from "../data/clubs.js?v=16";
import { addRankingEntry, getDailyBoards, getAllTimeBoards } from "../game/leaderboard.js?v=24";
import { pitchSlotsHTML, teamMedia, teamMediaEnd } from "./pitch.js?v=2";
import { realClubResult, realClubStatus } from "../game/real-results.js?v=2";
import { FORMATION_442 } from "../game/formation.js";
import { projectedMedia } from "../engine/aging.js?v=3";

// Share the page where the game is actually hosted — derived from the live URL
// so it's always correct regardless of domain. (Falls back for non-browser use.)
const SHARE_URL = (typeof location !== "undefined" && location.origin
  ? (location.origin + location.pathname).replace(/index\.html$/, "").replace(/\/+$/, "/")
  : "https://albacete-logrones.io");
const SHARE_HOST = SHARE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");

// Brand glyphs (inline SVG, fill uses each button's text colour) for the share row.
const ICONS = {
  whatsapp: `<svg class="sh-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.683-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.511 5.26l-.999 3.648 3.477-.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.166-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.612-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>`,
  facebook: `<svg class="sh-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  x: `<svg class="sh-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.933zm-1.291 19.5h2.039L6.486 3.24H4.298l13.312 17.413z"/></svg>`,
  instagram: `<svg class="sh-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
};

// Escape text before interpolating into innerHTML.
function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function ordinal(n) {
  return n + "º";
}

// Verdict category. It never claims a championship you didn't win: "CAMPEÓN"
// and "DINASTÍA" require actual league titles. Sides that never won the league
// are judged by points efficiency (and flagged if relegated).
function verdictTier(pct, titles, relegatedEver) {
  if (titles >= 3) return "DINASTÍA";
  if (titles >= 1) return "CAMPEÓN";
  if (relegatedEver) return "DESCENSO";
  if (pct >= 68) return "ASPIRANTE";
  if (pct >= 52) return "ZONA EUROPA";
  if (pct >= 38) return "MEDIA TABLA";
  if (pct >= 24) return "ZONA BAJA";
  return "SUFRIMIENTO";
}

// Renders the season-by-season results + a five-year summary + sharing.
// `yourClub` is the real club name the player managed.
export function renderResults(root, seasons, yourClub, picks, mode, onAgain) {
  let idx = 0;
  const displayName = CLUBS[yourClub]?.name || yourClub;
  const safeName = esc(displayName);
  const startYear = seasons[0].year;
  const modeLabel = { maldiniano: "Maldiniano", miequipo: "Mi Equipo", "miequipo-random": "Mi Equipo Random" }[mode] || "Clásico";

  // Leaderboard state: filled once the player saves their run.
  let myEntry = null;
  let dayBoards = null;   // today's runs
  let allBoards = null;   // all-time runs
  let rankRange = "day";  // "day" | "all"
  let rankTab = "all";    // "all" | "club" | "season" | "clubSeason"
  let showReal = false;   // real-life comparison toggle

  const clubAbbr = (c) => CLUBS[c]?.abbr || c.slice(0, 3).toUpperCase();
  const yy = (year) => `'${String(year % 100).padStart(2, "0")}`;
  const seasonLabel = (y) => `${y}–${String((y + 1) % 100).padStart(2, "0")}`;

  // Positions only exist for seasons actually played in La Liga.
  const playedPositions = seasons.filter(s => !s.inSegunda).map(s => s.position);
  const best = playedPositions.length ? Math.min(...playedPositions) : null;
  const worst = playedPositions.length ? Math.max(...playedPositions) : null;
  const titles = seasons.filter(s => s.honours.includes("La Liga")).length;
  const cups = seasons.filter(s => s.copaRound === "Campeón").length;
  const supercopas = seasons.filter(s => s.supercopa === "Campeón").length;
  const relegatedEver = seasons.some(s => s.relegated);

  // Five-year points efficiency: total points won / max attainable points.
  const totalPts = seasons.reduce((a, s) => a + s.record.Pts, 0);
  const maxPts = seasons.reduce((a, s) => a + s.record.P * s.pointsForWin, 0);
  const pct = maxPts > 0 ? Math.round((totalPts / maxPts) * 100) : 0;
  const tier = verdictTier(pct, titles, relegatedEver);

  function clubLabel(code) {
    return code === yourClub ? safeName : esc(CLUBS[code]?.name || code);
  }

  // The five-season arc as a quick emoji line (🥇 título · ↑ ascenso · 🔻 Segunda).
  function arcLine() {
    return seasons.map(s => {
      if (s.inSegunda) return s.ascended ? "🔻↑" : "🔻";
      if (s.position === 1) return "🥇";
      if (s.relegated) return `🔻${s.position}`;
      return `${s.position}º`;
    }).join(" ");
  }

  // A short, simple share message: club, the five-season arc, points %, trophies.
  function shareText() {
    const t = [];
    if (titles) t.push(`${titles}× Liga`);
    if (cups) t.push(`${cups}× Copa`);
    const trophyLine = t.length ? ` · ${t.join(" · ")}` : "";
    return `⚽ Gol De Oro · ${displayName}\n`
      + `${arcLine()}\n`
      + `${pct}% de los puntos en 5 temporadas${trophyLine}\n`
      + `Juega: ${SHARE_URL}`;
  }

  // Flash a confirmation label on a button, then restore it.
  function flash(btn, msg) {
    if (!btn) return;
    const prev = btn.dataset.label || btn.innerHTML;
    btn.dataset.label = prev;
    btn.innerHTML = msg;
    setTimeout(() => { btn.innerHTML = btn.dataset.label; }, 1600);
  }

  // Copy the share text to the clipboard, flashing confirmation on the button.
  async function copyShare(btn) {
    const text = shareText();
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      ta.remove();
    }
    flash(btn, ok ? "✅ ¡Copiado!" : "⚠️ Copia manual");
  }

  // ---- Share image: pitch + players + five-season results, as a JPG ----------

  // Truncate text to fit a max width, adding an ellipsis.
  function fitText(g, text, maxW) {
    if (g.measureText(text).width <= maxW) return text;
    let t = text;
    while (t.length > 1 && g.measureText(t + "…").width > maxW) t = t.slice(0, -1);
    return t + "…";
  }

  // Draw a portrait share card styled like the results screen: brand wordmark,
  // club + verdict, the five-season arc, the 4-4-2 pitch with every player, the
  // team-media swing, and a footer. Returns the canvas.
  function buildShareCanvas() {
    const W = 1080, H = 1500;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    g.textAlign = "center";

    // Background — the app's dark navy.
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0c1426"); bg.addColorStop(1, "#070a12");
    g.fillStyle = bg; g.fillRect(0, 0, W, H);

    // Brand wordmark (Bungee, slightly rotated like the on-screen logo).
    g.save();
    g.translate(W / 2, 84); g.rotate(-1.5 * Math.PI / 180);
    g.fillStyle = "#ffd23f"; g.font = '400 56px "Bungee", Inter, system-ui, sans-serif';
    g.fillText("GOL DE ORO", 0, 0);
    g.restore();

    // Club + verdict.
    g.fillStyle = "#fff"; g.font = "900 64px Inter, system-ui, sans-serif";
    g.fillText(fitText(g, displayName, W - 100), W / 2, 168);
    g.fillStyle = "#9be29b"; g.font = "800 30px Inter, system-ui, sans-serif";
    g.fillText(`${tier} · ${pct}% de los puntos posibles`, W / 2, 214);

    // Five season pills (champ gold / down red / normal navy), like the screen.
    const pillW = 178, gap = 16, totalW = 5 * pillW + 4 * gap;
    let x = (W - totalW) / 2;
    const py = 246, ph = 120;
    seasons.forEach((s) => {
      const champ = s.position === 1;
      const down = s.inSegunda || s.relegated;
      g.fillStyle = champ ? "#3a2f00" : down ? "#241a1a" : "#161622";
      g.strokeStyle = champ ? "#f5d040" : down ? "#4a2f2f" : "#2a2a3a";
      g.lineWidth = 3;
      roundRect(g, x, py, pillW, ph, 16); g.fill(); g.stroke();
      g.fillStyle = champ ? "#f5d040" : down ? "#ff9b9b" : "#fff";
      g.font = "900 50px Inter, system-ui, sans-serif";
      g.fillText(s.inSegunda ? "2ª" : String(s.position), x + pillW / 2, py + 62);
      g.fillStyle = "#9aa"; g.font = "600 24px Inter, system-ui, sans-serif";
      g.fillText(`'${String(s.year % 100).padStart(2, "0")}`, x + pillW / 2, py + 98);
      x += pillW + gap;
    });

    // Pitch with the XI.
    drawPitch(g, 70, 404, W - 140, 858);

    // Team media swing (start of run → projected at season 5).
    const tm0 = teamMedia(picks), tm1 = teamMediaEnd(picks);
    g.textAlign = "center"; g.fillStyle = "#cdd9ee";
    g.font = "700 30px Inter, system-ui, sans-serif";
    g.fillText(`Media del equipo  ${tm0} → ${tm1}`, W / 2, 1322);

    // Footer.
    g.fillStyle = "#cfcfe0"; g.font = "600 30px Inter, system-ui, sans-serif";
    const bestTxt = best != null ? `Mejor puesto: ${best}º` : "Descendido";
    g.fillText(`${bestTxt}   ·   ${titles}× Liga   ·   ${cups}× Copa`, W / 2, 1396);
    g.fillStyle = "#6a6a80"; g.font = "600 28px Inter, system-ui, sans-serif";
    g.fillText(SHARE_HOST, W / 2, 1452);
    return c;
  }

  // Draw the green field and the 11 player cards at their 4-4-2 positions, mirroring
  // the on-screen pitch. The formation y runs 0 (attack/top) → 92 (own goal), so
  // the keeper sits at the bottom and the strikers at the top.
  function drawPitch(g, ox, oy, w, h) {
    g.save();
    // Turf gradient + stripes (matches the on-screen .pitch).
    const turf = g.createLinearGradient(0, oy, 0, oy + h);
    turf.addColorStop(0, "#163d20"); turf.addColorStop(0.5, "#1a4a22"); turf.addColorStop(1, "#163d20");
    g.fillStyle = turf; roundRect(g, ox, oy, w, h, 18); g.fill();
    g.save(); roundRect(g, ox, oy, w, h, 18); g.clip();
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? "rgba(255,255,255,.018)" : "rgba(0,0,0,.05)";
      g.fillRect(ox, oy + (h / 8) * i, w, h / 8);
    }
    // Markings.
    g.strokeStyle = "rgba(255,255,255,.32)"; g.lineWidth = 3;
    g.strokeRect(ox + 10, oy + 10, w - 20, h - 20);
    g.beginPath(); g.moveTo(ox + 10, oy + h / 2); g.lineTo(ox + w - 10, oy + h / 2); g.stroke();
    g.beginPath(); g.arc(ox + w / 2, oy + h / 2, 70, 0, Math.PI * 2); g.stroke();
    const boxW = w * 0.5, boxH = h * 0.12;
    g.strokeRect(ox + (w - boxW) / 2, oy + 10, boxW, boxH);            // top box
    g.strokeRect(ox + (w - boxW) / 2, oy + h - 10 - boxH, boxW, boxH); // bottom box
    g.restore();

    FORMATION_442.forEach((slot) => {
      const pick = picks.find(p => p.slotId === slot.id);
      const cx = ox + (slot.x / 100) * w;
      const cy = oy + (slot.y / 100) * h;
      if (pick) drawSlotCard(g, cx, cy, slot, pick, w);
    });
    g.restore();
  }

  // One player card: dark plate + gold border, POS (gold), name (white),
  // club + year (gold), and the begin→end media pill coloured up/down/flat.
  function drawSlotCard(g, cx, cy, slot, pick, pitchW) {
    const cardW = Math.min(Math.max(pitchW * 0.205, 150), 192);
    const cardH = 108;
    const x = cx - cardW / 2, y = cy - cardH / 2;
    g.textAlign = "center"; g.textBaseline = "alphabetic";
    g.fillStyle = "rgba(9,22,13,.92)";
    g.strokeStyle = "rgba(245,210,63,.55)"; g.lineWidth = 2;
    roundRect(g, x, y, cardW, cardH, 12); g.fill(); g.stroke();

    g.fillStyle = "#f5d040"; g.font = "800 18px Inter, system-ui, sans-serif";
    g.fillText(slot.pos, cx, y + 24);
    g.fillStyle = "#fff"; g.font = "800 22px Inter, system-ui, sans-serif";
    g.fillText(fitText(g, pick.player.name, cardW - 16), cx, y + 50);
    g.fillStyle = "#ffd23f"; g.font = "700 15px Inter, system-ui, sans-serif";
    g.fillText(`${clubAbbr(pick.club)} ${yy(pick.year)}`, cx, y + 70);

    const begin = pick.player.media, end = projectedMedia(pick.player, 4);
    const col = end > begin ? "#9be29b" : end < begin ? "#ff9b9b" : "#f5d040";
    const fill = end > begin ? "rgba(155,226,155,.16)" : end < begin ? "rgba(255,155,155,.14)" : "rgba(245,210,63,.16)";
    const txt = `${begin} → ${end}`;
    g.font = "800 16px Inter, system-ui, sans-serif";
    const pw = g.measureText(txt).width + 22, ph = 26, pyy = y + cardH - 32;
    g.fillStyle = fill; g.strokeStyle = col; g.lineWidth = 1.5;
    roundRect(g, cx - pw / 2, pyy, pw, ph, 13); g.fill(); g.stroke();
    g.fillStyle = col; g.fillText(txt, cx, pyy + 18);
  }

  // Promisified canvas → Blob.
  function canvasBlob(canvas, type = "image/jpeg", quality = 0.92) {
    return new Promise((res) => canvas.toBlob(res, type, quality));
  }

  function triggerDownload(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Wait for web fonts so the canvas renders with Bungee/Inter, not a fallback.
  async function fontsReady() {
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; }
    catch { /* ignore */ }
  }

  // Download the share image as a JPG.
  async function downloadImage(btn) {
    await fontsReady();
    const blob = await canvasBlob(buildShareCanvas());
    if (!blob) return;
    triggerDownload(blob, `${displayName.replace(/\s+/g, "-")}-gol-de-oro.jpg`);
    flash(btn, "✅ Imagen guardada");
  }

  // Share the JPG (pitch + players + results) via the native sheet — which on
  // mobile includes WhatsApp. Falls back to downloading the image (and, when
  // asked, opening WhatsApp web with the text) on browsers without file sharing.
  async function shareImage(btn, { whatsapp = false } = {}) {
    const text = shareText();
    let file = null;
    try {
      await fontsReady();
      const blob = await canvasBlob(buildShareCanvas());
      if (blob) file = new File([blob], `${displayName.replace(/\s+/g, "-")}-gol-de-oro.jpg`, { type: "image/jpeg" });
    } catch { /* canvas unavailable */ }

    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], text, title: "Gol De Oro" }); }
      catch { /* user dismissed */ }
      return;
    }
    // Fallback: hand over the image as a download, then open WhatsApp web with
    // the text so it can be attached manually.
    if (file) triggerDownload(file, file.name);
    if (whatsapp) {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    }
    flash(btn, file ? "✅ Imagen guardada" : "⚠️ No disponible");
  }

  function paint() {
    const r = seasons[idx];
    const rec = r.record;
    root.innerHTML = `
      <section class="screen results">
        <div class="rs-nav">
          <button id="prev" ${idx === 0 ? "disabled" : ""}>◀</button>
          <div class="rs-title">
            <b>${r.year} / ${String((r.year + 1) % 100).padStart(2, "0")}</b>
            <small>${safeName.toUpperCase()} · TEMPORADA ${idx + 1} DE 5</small>
          </div>
          <button id="next" ${idx === seasons.length - 1 ? "disabled" : ""}>▶</button>
        </div>
        <div class="rs-dots">${seasons.map((_, i) => `<i class="${i === idx ? "on" : ""}"></i>`).join("")}</div>

        ${r.inSegunda ? `
        <div class="rs-banner${r.ascended ? " rs-banner-promo" : " rs-banner-down"}">
          <div class="rs-rank">2ª${r.ascended ? " ↑" : ""}</div>
          <div class="rs-rec">
            <b>${safeName}</b>${r.ascended ? " · <span class='promo-tag'>ASCENSO</span>" : ""}<br>
            En Segunda División · <b>0 pts</b> en La Liga
          </div>
        </div>
        <div class="rs-relnote${r.ascended ? " rs-promonote" : ""}">${r.ascended
          ? "¡Lograste el ascenso! Tu equipo vuelve a Primera la próxima temporada."
          : "Tu equipo está en Segunda y no compite esta temporada en Primera."}</div>
        ` : `
        <div class="rs-banner${r.relegated ? " rs-banner-down" : (r.promocion ? " rs-banner-promo" : "")}">
          <div class="rs-rank">${ordinal(r.position)}${r.relegated ? " ↓" : (r.promocion ? " ⇄" : "")}</div>
          <div class="rs-rec">
            <b>${safeName}</b>${
              r.relegated && r.promocion ? " · <span class='rel-tag'>PROMOCIÓN · DESCENSO</span>"
              : r.relegated ? " · <span class='rel-tag'>DESCENSO</span>"
              : r.promocion ? " · <span class='promo-tag'>PROMOCIÓN · SALVADO</span>" : ""}<br>
            P${rec.P} · ${rec.W}V ${rec.D}E ${rec.L}D · ${rec.GF}–${rec.GA} · <b>${rec.Pts} pts</b>
          </div>
        </div>
        ${r.promocion ? `<div class="rs-relnote ${r.relegated ? "" : "rs-promonote"}">Jugaste la promoción${r.relegated ? " y caíste a Segunda." : " y mantuviste la categoría."}</div>` : ""}

        <div class="rs-grid">
          <div>
            <div class="rs-h">Clasificación final</div>
            <table class="rs-tbl">${r.table.map((row, i) => {
              const directZone = i >= r.table.length - r.directSpots;
              const promoZone = !directZone && r.promocionSpots > 0 &&
                i >= r.table.length - r.directSpots - r.promocionSpots;
              const cls = directZone ? "rel" : (promoZone ? "promo" : "");
              return `<tr class="${row.isYou ? "me" : ""} ${cls}"><td class="p">${i + 1}</td>
               <td>${clubLabel(row.club)}</td><td class="pts">${row.pts}</td></tr>`;
            }).join("")}
            </table>
            <div class="rs-rellegend">▼ Descenso directo (${r.directSpots})${r.promocionSpots ? ` · <span class="promo-legend">Promoción (${r.promocionSpots})</span>` : ""}</div>
          </div>
          <div>
            <div class="rs-h">Máximos goleadores</div>
            <table class="rs-sc">${r.topScorers.map(s =>
              `<tr class="${s.isYou ? "me" : ""}"><td>${esc(s.name)}<div class="cl">${clubLabel(s.club)}</div></td>
               <td class="g">${s.goals}</td></tr>`).join("")}
            </table>
            <div class="rs-h" style="margin-top:12px">Títulos y copas</div>
            <div class="rs-hon">
              ${r.honours.includes("La Liga") ? `🏆 La Liga<br>` : ""}
              ${r.copaRound === "Campeón"
                ? `🏆 Copa del Rey<br>`
                : `Copa del Rey: <b>${esc(r.copaRound)}</b><br>`}
              ${r.supercopa
                ? (r.supercopa === "Campeón"
                    ? `🏆 Supercopa`
                    : `Supercopa: <b>Subcampeón</b>`)
                : ""}
            </div>
          </div>
        </div>
        `}

        <div class="rs-summary">
          <div class="rs-h">Resumen · 5 temporadas</div>
          <div class="rs-verdict">${tier}</div>
          <div class="rs-score"><b>${pct}%</b> de los puntos posibles <small>(${totalPts}/${maxPts})</small></div>
          <div class="rs-pills">
            ${seasons.map((s, i) => `
              <button class="rs-pill ${s.position === 1 ? "win" : ""} ${(s.inSegunda || s.relegated) ? "down" : ""} ${i === idx ? "cur" : ""}" data-i="${i}">
                <b>${s.inSegunda ? "2ª" : s.position}</b><small>'${String(s.year % 100).padStart(2, "0")}</small>
              </button>`).join("")}
          </div>
          <div class="rs-summary-stats">
            ${best != null ? `Mejor: ${ordinal(best)} · Peor: ${ordinal(worst)}` : "Sin temporadas en Primera"}${relegatedEver ? " · ⚠️ Descenso" : ""}
          </div>
          <div class="rs-trophies">
            ${titles ? `<span class="rs-tr"><i>Liga</i> ${"🏆".repeat(titles)}</span>` : ""}
            ${cups ? `<span class="rs-tr"><i>Copa</i> ${"🏆".repeat(cups)}</span>` : ""}
            ${supercopas ? `<span class="rs-tr"><i>Supercopa</i> ${"🏆".repeat(supercopas)}</span>` : ""}
            ${(titles + cups + supercopas) === 0 ? `<span class="rs-tr-none">Sin títulos en 5 temporadas</span>` : ""}
          </div>
        </div>

        <div class="rs-squad">
          <div class="rs-h">Tu once · Media del equipo <b class="rs-team-media">${teamMedia(picks)} → ${teamMediaEnd(picks)}</b></div>
          <div class="pitch rs-pitch">${pitchSlotsHTML(picks, { showMedia: true })}</div>
        </div>

        ${realComparisonSection()}

        ${rankingSection()}

        <div class="rs-share">
          <div class="rs-h">Comparte tu resultado</div>
          <div class="rs-share-main">
            <button class="sh sh-wa" id="waBtn">${ICONS.whatsapp}<span>WhatsApp</span></button>
            <button class="sh sh-native" id="shareBtn">📲 <span>Compartir</span></button>
          </div>
          <div class="rs-share-btns">
            <button class="sh sh-ig" id="igBtn">🖼️ <span>Descargar imagen</span></button>
            <button class="sh sh-copy" id="copyBtn">📋 <span>Copiar texto</span></button>
          </div>
          <p class="rs-share-note">La imagen incluye tu alineación y los resultados de las 5 temporadas.</p>
        </div>

        <button id="again" class="primary">Construir otro XI</button>
      </section>`;

    root.querySelector("#prev").addEventListener("click", () => { if (idx > 0) { idx--; paint(); } });
    root.querySelector("#next").addEventListener("click", () => { if (idx < seasons.length - 1) { idx++; paint(); } });
    root.querySelectorAll(".rs-pill").forEach(b =>
      b.addEventListener("click", () => { idx = Number(b.dataset.i); paint(); }));
    root.querySelector("#waBtn").addEventListener("click", (e) => shareImage(e.currentTarget, { whatsapp: true }));
    root.querySelector("#shareBtn").addEventListener("click", (e) => shareImage(e.currentTarget));
    root.querySelector("#copyBtn").addEventListener("click", (e) => copyShare(e.currentTarget));
    root.querySelector("#igBtn").addEventListener("click", (e) => downloadImage(e.currentTarget));
    root.querySelector("#again").addEventListener("click", onAgain);
    const toggleReal = root.querySelector("#toggleReal");
    if (toggleReal) toggleReal.addEventListener("click", () => { showReal = !showReal; paint(); });
    wireRanking();
  }

  // --- Real-life comparison ----------------------------------------------

  // How your managed run compares to how the real club actually did those years.
  // A season is "comparable" whenever the two can be ranked: both in Primera
  // (lower position wins), or one in Primera and the other down in Segunda (the
  // top-flight side wins). Two Segunda seasons, or years outside the dataset,
  // can't be ranked and are skipped.
  function realComparisonSection() {
    const mineCell = (s) => s.inSegunda ? `2ª` : `${s.position}º · ${s.record.Pts}`;
    const realCell = (year) => {
      const st = realClubStatus(yourClub, year);
      if (st.inPrimera) return `${st.position}º · ${st.pts}`;
      return st.inSegunda ? `2ª` : `—`;
    };
    // Decide a single season: returns true (you better), false (worse), or null
    // (not comparable).
    const outcome = (s) => {
      const st = realClubStatus(yourClub, s.year);
      const youUp = !s.inSegunda, realUp = st.inPrimera;
      if (youUp && realUp) return s.position < st.position;     // both in Primera
      if (youUp && st.inSegunda) return true;                    // you up, they went down
      if (s.inSegunda && realUp) return false;                   // you down, they stayed up
      return null;                                               // both down / no data
    };
    let better = 0, comparable = 0;
    seasons.forEach((s) => {
      const o = outcome(s);
      if (o === null) return;
      comparable++;
      if (o) better++;
    });

    const button = `<button id="toggleReal" class="rs-real-btn">${showReal ? "Ocultar comparación" : `Comparar con el ${safeName} real`}</button>`;
    if (!showReal) {
      return `<div class="rs-real-box"><div class="rs-h">¿Lo hiciste mejor que la historia?</div>${button}</div>`;
    }
    const rows = seasons.map((s) => {
      const win = outcome(s) === true;
      return `
      <tr>
        <td class="yr">${seasonLabel(s.year)}</td>
        <td class="${win ? "win" : ""}">${mineCell(s)}</td>
        <td class="real">${realCell(s.year)}</td>
      </tr>`;
    }).join("");
    const verdict = comparable === 0
      ? `Sin temporadas comparables: el ${safeName} real no estuvo en Primera esos años.`
      : `Superaste al ${safeName} real en <b>${better}</b> de ${comparable} ${comparable === 1 ? "temporada comparable" : "temporadas comparables"}.`;
    return `
      <div class="rs-real-box">
        <div class="rs-h">Tú vs el ${safeName} real</div>
        <table class="rs-real-tbl">
          <tr class="hd"><td>Temporada</td><td>Tú · pts</td><td>Real · pts</td></tr>
          ${rows}
        </table>
        <div class="rs-real-verdict">${verdict}</div>
        <div class="rs-real-note">"2ª" = en Segunda esa temporada (perder la categoría es peor que cualquier puesto en Primera) · "—" = sin datos.</div>
        ${button}
      </div>`;
  }

  // --- Leaderboard (daily + all-time) -------------------------------------

  function rankingSection() {
    if (!myEntry) {
      return `
        <div class="rs-rank-box">
          <div class="rs-h">Ranking · <span class="rs-rank-scope">${modeLabel}</span></div>
          <p class="rs-rank-intro">Añade tu nombre y entra en el ranking del día y el histórico de hoy en modo <b>${modeLabel}</b>.</p>
          <div class="rs-rank-form">
            <input id="playerName" maxlength="20" placeholder="Tu nombre" autocomplete="off" />
            <button id="saveRank" class="primary">Entrar al ranking</button>
          </div>
        </div>`;
    }
    const ranges = [
      { key: "day", label: "Hoy" },
      { key: "all", label: "Histórico" },
    ];
    const tabs = [
      { key: "all", label: "General" },
      { key: "club", label: clubAbbr(yourClub) },
      { key: "season", label: yy(startYear) },
      { key: "clubSeason", label: `${clubAbbr(yourClub)} ${yy(startYear)}` },
    ];
    const scopeTitle = {
      all: "General",
      club: displayName,
      season: seasonLabel(startYear),
      clubSeason: `${displayName} · ${seasonLabel(startYear)}`,
    }[rankTab];
    const rangeTitle = rankRange === "day" ? "Hoy" : "Histórico";
    const board = (rankRange === "day" ? dayBoards : allBoards)[rankTab];
    return `
      <div class="rs-rank-box">
        <div class="rs-h">Ranking · <span class="rs-rank-scope">${modeLabel}</span> · <span class="rs-rank-scope">${rangeTitle}</span> · <span class="rs-rank-scope">${esc(scopeTitle)}</span></div>
        <div class="rs-rank-tabs rs-rank-ranges">
          ${ranges.map(r => `<button class="rk-tab rk-range ${r.key === rankRange ? "on" : ""}" data-range="${r.key}">${r.label}</button>`).join("")}
        </div>
        <div class="rs-rank-tabs">
          ${tabs.map(t => `<button class="rk-tab ${t.key === rankTab ? "on" : ""}" data-tab="${t.key}">${esc(t.label)}</button>`).join("")}
        </div>
        <table class="rs-rank-tbl">${boardRows(board)}</table>
        <div class="rs-rank-pos">Tu posición: <b>${board.myRank}º</b> de ${board.total}</div>
      </div>`;
  }

  function boardRows(board) {
    const { sorted, total, myRank } = board;
    const isMe = (e) => myEntry && e.ts === myEntry.ts && e.name === myEntry.name;
    const row = (e, rank) => `
      <tr class="${isMe(e) ? "me" : ""}">
        <td class="p">${rank}º</td>
        <td>${esc(e.name)}<div class="cl">${clubAbbr(e.club)} ${yy(e.year)}</div></td>
        <td class="pts">${e.pct}%</td>
      </tr>`;
    const gap = `<tr class="rk-gap"><td colspan="3">⋯</td></tr>`;

    // Small field: show everyone, ranked.
    if (total <= 10) return sorted.map((e, i) => row(e, i + 1)).join("");

    // Large field: top 5 (most %), then the player if mid-table, then bottom 5 (least %).
    const top = sorted.slice(0, 5).map((e, i) => row(e, i + 1)).join("");
    const bottom = sorted.slice(-5).map((e, i) => row(e, total - 5 + i + 1)).join("");
    const inMiddle = myRank > 5 && myRank <= total - 5;
    const mid = inMiddle ? gap + row(sorted[myRank - 1], myRank) : "";
    return top + mid + gap + bottom;
  }

  function wireRanking() {
    const saveBtn = root.querySelector("#saveRank");
    if (saveBtn) {
      const submit = () => {
        const name = root.querySelector("#playerName").value.trim();
        myEntry = addRankingEntry({ name, club: yourClub, year: startYear, pct, mode });
        dayBoards = getDailyBoards(myEntry);
        allBoards = getAllTimeBoards(myEntry);
        paint();
      };
      saveBtn.addEventListener("click", submit);
      root.querySelector("#playerName").addEventListener("keydown", (e) => {
        if (e.key === "Enter") submit();
      });
    }
    root.querySelectorAll(".rk-range").forEach(b =>
      b.addEventListener("click", () => { rankRange = b.dataset.range; paint(); }));
    root.querySelectorAll(".rk-tab[data-tab]").forEach(b =>
      b.addEventListener("click", () => { rankTab = b.dataset.tab; paint(); }));
  }
  paint();
}

// Rounded-rect path helper for the canvas share card.
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
