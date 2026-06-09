# Rankings — DynamoDB data model

This document specifies how the **"Ranking del día"** feature maps onto DynamoDB,
so the current per-browser store (`src/game/leaderboard.js`, backed by
`localStorage`) can be replaced by a shared, global ranking.

Scope of this deliverable: **data model + infrastructure-as-code only.** The
table is defined in [`infra/rankings-table.yaml`](../infra/rankings-table.yaml)
(AWS SAM). No Lambda/API or client wiring is included yet.

---

## What we're modelling

A finished run produces one ranking entry:

```js
{ name, club, year, pct, date, ts }   // date = "YYYY-MM-DD", ts = Date.now()
```

The UI then renders **four boards, all scoped to a single calendar date**:

| Board         | Filter                          |
| ------------- | ------------------------------- |
| `all`         | every entry for `date`          |
| `club`        | `date` + `club`                 |
| `season`      | `date` + `year`                 |
| `clubSeason`  | `date` + `club` + `year`        |

Within every board the order is: **`pct` descending, earlier `ts` wins ties.**

---

## Access patterns

| # | Pattern                                              | Index             | Key condition                                     | Read direction        |
| - | ---------------------------------------------------- | ----------------- | ------------------------------------------------- | --------------------- |
| 1 | Submit a finished run                                | base table        | `PutItem`                                         | —                     |
| 2 | Overall board for a day                              | base table        | `PK = DATE#<date>`                                | `ScanIndexForward=false` |
| 3 | Board for a day + club                               | `ClubDailyIndex`  | `GSI1PK = DATE#<date>#CLUB#<club>`                | `ScanIndexForward=false` |
| 4 | Board for a day + season                             | `SeasonDailyIndex`| `GSI2PK = DATE#<date>#YEAR#<year>`                | `ScanIndexForward=false` |
| 5 | Board for a day + club + season                      | `ClubSeasonDailyIndex` | `GSI3PK = DATE#<date>#CLUB#<club>#YEAR#<year>` | `ScanIndexForward=false` |

All four read patterns share one sort key (`SK` = `rankKey`), so each is a single
`Query` that returns rows already in rank order — no in-memory sorting, no extra
round trips. Add `Limit=N` to fetch only the top N.

---

## Single-table design

One item per run. The base table serves the overall board; three GSIs serve the
scoped boards. Each GSI reuses the same `rankKey` as its sort key.

### Item shape

```jsonc
{
  "PK":     "DATE#2026-06-09",                          // overall partition
  "SK":     "S087#T9989999999999#k3f9a",                // rankKey (see below)

  "GSI1PK": "DATE#2026-06-09#CLUB#Albacete",            // club partition
  "GSI2PK": "DATE#2026-06-09#YEAR#1994",                // season partition
  "GSI3PK": "DATE#2026-06-09#CLUB#Albacete#YEAR#1994",  // club+season partition

  "name":   "Raúl",
  "club":   "Albacete",
  "year":   1994,
  "pct":    87,
  "date":   "2026-06-09",
  "ts":     1749480000000,
  "id":     "k3f9a",
  "expiresAt": 1749600000                               // TTL (epoch seconds)
}
```

The three GSIs use `SK` as their range key, so it is **not** repeated as a
separate `GSI*SK` attribute.

### The sort key (`rankKey`)

```
rankKey = "S" + pct3 + "#T" + tsInv + "#" + id
```

- `pct3` — `pct` zero-padded to 3 digits (`5 → "005"`, `100 → "100"`).
- `tsInv` — `(9999999999999 - ts)` zero-padded to 13 digits (epoch ms, inverted).
- `id` — short unique token generated at submit time (e.g. `crypto.randomUUID()`
  slice) to guarantee `SK` uniqueness within a partition.

Reading a partition with `ScanIndexForward=false` (descending) gives:

1. **Highest `pct` first** — `pct3` is zero-padded, so lexicographic order equals
   numeric order.
2. **Ties broken by earliest `ts`** — inverting `ts` means the earliest
   submission has the largest `tsInv`, so it sorts ahead under descending read.

This reproduces `leaderboard.js`'s `sort((a,b) => b.pct - a.pct || a.ts - b.ts)`
exactly, but at the index level.

### Finding "my rank"

The current code tags the player's own row and reports a 1-based rank. With the
boards already sorted, the caller finds its own `id` in the returned list. To get
rank without pulling the whole board, issue a parallel `Query ... Select=COUNT`
with `SK > <my rankKey>` on the same partition; rank = count + 1.

---

## Table configuration

| Setting            | Value               | Why                                                        |
| ------------------ | ------------------- | ---------------------------------------------------------- |
| Billing mode       | `PAY_PER_REQUEST`   | Spiky, low-volume traffic — no capacity to forecast.       |
| TTL attribute      | `expiresAt`         | Boards are "today only"; old entries auto-expire.          |
| GSI projection     | `ALL`               | Entries are tiny; lets board queries avoid base-table reads. |
| PITR               | enabled             | Cheap protection against accidental data loss.             |
| Deletion policy    | `Retain`            | A stack delete must not wipe live boards.                  |

### TTL value

Set `expiresAt` to the end of the entry's calendar day plus a grace window
(e.g. +24–48h) in epoch **seconds**. DynamoDB deletes expired items within ~48h
of expiry, which is fine since reads always filter on the current `date`.

---

## Deploying

```bash
sam deploy \
  --template-file infra/rankings-table.yaml \
  --stack-name gol-de-oro-rankings \
  --parameter-overrides Stage=prod \
  --capabilities CAPABILITY_IAM
```

The stack exports `RankingsTableName` and `RankingsTableArn` for a future
API/Lambda layer to import.

---

## Mapping back to `leaderboard.js`

| `leaderboard.js`               | DynamoDB equivalent                                            |
| ------------------------------ | -------------------------------------------------------------- |
| `addRankingEntry({...})`       | `PutItem` building the keys above (pattern 1)                  |
| `getDailyBoards(me).all`       | Query base table, `PK = DATE#<date>` (pattern 2)               |
| `getDailyBoards(me).club`      | Query `ClubDailyIndex` (pattern 3)                             |
| `getDailyBoards(me).season`    | Query `SeasonDailyIndex` (pattern 4)                           |
| `getDailyBoards(me).clubSeason`| Query `ClubSeasonDailyIndex` (pattern 5)                       |
| `today()`                      | `date` partition prefix; the client still supplies it          |
| storage-disabled fallback      | N/A — the server is the source of truth (keep local as offline cache) |
