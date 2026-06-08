# Albacete – Logroñés — Design Spec

**Date:** 2026-06-08
**Status:** Approved (design); pending implementation plan
**Working title / domain:** `albacete-logrones.io` (brand displays "Albacete – Logroñés" with the ñ; URL uses ASCII `logrones`)

## 1. Concept

A free, browser-based football game in the mould of *38-0-0*, themed on **1980–2025 Spanish (La Liga) football** with a strong 90s *fútbol modesto* flavour. The player names their own club, drafts a starting XI one player at a time from real historical squads, then watches that XI compete across **five consecutive seasons**, earning a league finishing position (and honours) each year.

The novelty versus *38-0-0* is the **five-year dynasty arc**: instead of one projected 38-game record, you get a five-season story (rise, peak, decline) driven by player aging, real era-strength opponents, and season variance.

### Goal / scope level
Commercial web game (same playbook as *38-0-0*): SEO content pages, ads + IAP plumbing, shareable results. Built to attract traffic and earn.

## 2. Core loop

1. **Setup** — player types a **team name** (text only, no crest/colours in v1) and selects a **start year** (1980–2025).
2. **Draft XI** — **single fixed formation: 4-4-2**. Spin → a random real **club + season** is drawn → player drafts **one** player from that squad into an open position → repeat until 11 positions filled. Identical mechanic to *38-0-0* (spin-per-player).
3. **Simulate** — the drafted XI competes for **five consecutive seasons** starting at the chosen year.
4. **Results** — season-by-season navigable screen (see §5).

## 3. Simulation engine (the central design decision)

No match engine. Your team is **inserted into the real historical final table** of each season.

### Inputs (data)
- Per season: the **real final league table** (each real club + its actual points total) and the **real top scorers**. These are documented historical facts — far lighter to source than full per-player stats.
- Your drafted XI → a **team strength** scalar: a weighted sum of player `overall` ratings, weighted by how well each player fits the 4-4-2 position they were drafted into (same principle as *38-0-0*'s position-fit-weighted record projection).

### Method, per season
1. Convert team strength → **projected points** for that season.
2. **Insert** your team into that season's real final table at the points-implied rank, displacing real clubs below you.
3. Your rank in the resulting table = your **finishing position**.
4. **Aging:** each season, every drafted player ages +1 year; their `overall` drifts along an age/peak curve (young players may rise first, older players decline). This shifts team strength — and position — across the five years.
5. **Variance:** apply small per-season random noise to projected points so the arc is not perfectly smooth.
6. **Opponents vary by real history:** because you are dropped into *that season's actual table*, a strong title-race season vs a weak one naturally changes where you land — no extra modelling needed.

### Honours
- **Copa del Rey** (and optionally European qualification/finish if you place high): resolved per season as a **probability derived from team strength**. Produces the honours line on the results screen.

### Why this approach
- Authentic (real tables, real rivals, real top scorers).
- Cheap on data (final tables + top scorers, not full rosters with stats).
- Playable end-to-end **now** with stubbed player ratings + a small set of real historical seasons.
- Scales by adding more seasons' tables — no engine work to extend coverage.

## 4. Screens

Reuses *38-0-0*'s screen structure and CSS idioms:

- **Setup** — team name input + start-year selector.
- **Spin / Draft + Pitch** — reels (club + season), draft list, 4-4-2 pitch with slot nodes filling as you draft.
- **Results** — season-by-season (see §5).
- **Content / SEO** — About, How to Play, guides; consent banner; ads + IAP rows. Same as *38-0-0*.

## 5. Results screen (approved: option B)

Navigate ◀ ▶ through the five seasons (with progress dots). Each season shows:

- **Your team banner** — finishing position + full record (P, W, D, L, GF–GA, points).
- **Final table** — top teams with your club slotted among real rivals (era-accurate division size), relegation places shown at the bottom.
- **Top scorers** — league-wide, with clubs; your own drafted striker can appear (computed in).
- **Honours** — league finish + any cup wins that season.

## 6. League structure

**Era-accurate** division size per season: 18 / 20 / 22 teams as it actually was across 1980–2025 (e.g. 18 in much of the 80s, 22 briefly mid-90s, 20 from 1997–98). The table size and rival set come from each season's real historical data.

## 7. Data model

```
clubs:   { CODE: { name } }
seasons: { YEAR: { divisionSize, finalTable: [ {club, pts} ], topScorers: [ {name, club, goals} ] } }
squads:  { "CLUB|YEAR": [ { name, positions:[..], age, overall, pac, sho, pas, dri, def, phy } ] }
```

- Stat fields (`overall`, `pac`…`phy`) are **blank/stubbed for now**; the schema is fixed so real values drop in later.
- The engine consumes `overall` (+ position fit) and `age` (for the aging curve).

### v1 build data
A **small real sample**: Albacete Balompié and CD Logroñés around the mid-90s, plus enough real rivals/final-table data to populate those seasons' tables and top scorers. Ratings stubbed so the engine runs end-to-end. Most other club/season combos remain empty until the full dataset is added later.

## 8. Tech stack

**Vanilla HTML / CSS / JS** — no build step, static files, deploy anywhere. Matches *38-0-0* exactly: best for SEO + AdSense/IAP, fastest to ship, easy to hand off.

## 9. Explicitly OUT of v1 (schema/structure stays ready for them)

- Multiple formations (only 4-4-2 in v1).
- Classic / Expert mode split (single mode; stats hidden because blank).
- Crests / colours / kit customisation.
- The full 45-year dataset (only the small real sample ships).
- Native app wrapper (Capacitor).
- Full match simulation (intentionally avoided — see §3).

## 10. Legal posture (context, not implementation)

- Brand is a **fixture-style juxtaposition of two real clubs** + toponyms — weaker trademark exposure than branding as a single famous club, and far safer than a living person's name (which earlier candidates "Tato Abadía" and "Gol en Las Gaunas" ran into — the latter is already a registered class-41 mark).
- Use **club names as text only**; no crests, kits, or league logos.
- Carry an "unofficial, not affiliated" disclaimer (as *38-0-0* does).
- Player **names** are factual references; player **stats** to be sourced as own/computed data, never scraped from EA/SoFIFA, to avoid database-right exposure.
- Run OEPM + EUIPO clearance on "Albacete Logroñés" / `albacete-logrones` in classes 9 & 41 before committing the brand.
- Not legal advice; one hour with a Spanish/EU IP solicitor advised before significant monetisation.
