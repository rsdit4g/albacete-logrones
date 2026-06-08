# Albacete – Logroñés — v2 Design Delta

**Date:** 2026-06-08
**Status:** Approved (design); supersedes parts of the v1 spec
**Base:** builds on `2026-06-08-albacete-logrones-design.md`

This documents the changes requested after playtesting v1. Only the deltas are described; everything not mentioned carries over from v1.

## 1. Dramatic two-stage spin
The spin reveals in two stages for tension: the **club reel** spins and locks first, then the **year reel** spins and locks. Visible animation (reel blur/scroll, slowdown, lock), not an instant swap.

## 2. Real, year-accurate data for 1990–2010
The five simulated seasons use the **real historical data for each actual year** (no fallback to a single sample season). Scope for this phase: **1990–2010** (21 seasons).
- **Real & sourced:** final league tables (clubs + points, correct division size and points-for-win per era — 2 pts/win through 1994–95, 3 pts from 1995–96), and top scorers (Pichichi + leading scorers).
- **Real membership, assigned ratings:** which players were in a club's squad that season is factual; the attribute *numbers* (see §7) are assigned ratings (no historical source exists), in the spirit of FIFA-style ratings.
- **Phased coverage:** real tables + top scorers for all of 1990–2010; real squads with assigned attributes for an initial set of marquee clubs across the window, expandable club-by-club. The schema and pipeline support incremental population.

## 3. Five-year summary strip
The results screen keeps the season-by-season view (v1 option B) **and** adds a **five-year summary strip at the bottom**: the position arc across the 5 seasons, total honours, best/worst finish, and an overall verdict tier.

## 4. Per-network sharing
Share the five-year result via explicit **WhatsApp, Facebook, and X (Twitter)** buttons with prefilled text + a link, plus an **image download** (an auto-generated result card) for Instagram (which does not accept link/text shares). Uses the native share sheet where available; explicit per-network intent URLs otherwise.

## 5. Setup = pick a real club + year; seed 4 players
Replaces the v1 custom team name. At setup the player:
1. Picks a **real club** and a **year** (constrained to club+seasons that have squad data).
2. **Is** that club for the run (identity = the real club name; no free-text name, so the v1 XSS surface is gone).
3. **Drafts 4 players** of their choice from that club's real squad for that season into the XI.
4. **Spins for the remaining 7** (the v1 spin-per-player mechanic) from random club+season draws.

Simulation: the player's drafted XI determines the club's strength; the club takes its own slot in each season's real table (replacing its real historical row for the start year onward).

## 6. Simplified positions: GK / DF / MF / AT
Player positions collapse from detailed roles to four buckets: **GK** (goalkeeper), **DF** (defence), **MF** (midfield), **AT** (ataque/attack). The 4-4-2 becomes **1 GK, 4 DF, 4 MF, 2 AT**. Position fit is a bucket match: 1.0 if the player's bucket matches the slot, lower otherwise.

## 7. Attributes: Velocidad, Resistencia, Agresividad, Calidad, Media
Each player carries:
- **Velocidad, Resistencia, Agresividad, Calidad** — the four base attributes (0–99).
- **Media** — the overall, computed as the **average of the four with a small random nudge** (stored per player; deterministic in data).

**Team strength formula (per player, before position-fit weighting):**
```
playerRating = 0.80 * Media
             + 0.10 * average(Velocidad, Resistencia, Agresividad)
             + 0.10 * Calidad
```
Team strength = average of `playerRating * positionFit` across the XI (same aggregation shape as v1). Season variance continues to be applied in the simulation engine on top of this.

The v1 stat fields (`pac, sho, pas, dri, def, phy`, `overall`) are replaced by `{ velocidad, resistencia, agresividad, calidad, media }`. `media` takes the role v1's `overall`/`teamStrength` consumed.

## Data model (v2)
```
clubs:   { CODE: { name } }
seasons: { YEAR: { label, divisionSize, pointsForWin, finalTable:[{club,pts}], topScorers:[{name,club,goals}] } }
squads:  { "CLUB|YEAR": [ { name, pos: "GK"|"DF"|"MF"|"AT",
                            velocidad, resistencia, agresividad, calidad, media, age } ] }
```
(`pos` is a single bucket now, not an array of detailed roles.)

## Out of scope (unchanged from v1 deferral)
Full 1980–2025 coverage beyond 1990–2010; ads/IAP; SEO/content pages; native wrapper; multiple formations; Classic/Expert modes.
