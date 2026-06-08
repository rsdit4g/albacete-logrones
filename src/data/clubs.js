import { REAL_SEASONS } from "./real-seasons.js";

// Short 3-letter codes for pitch labels (e.g. "RMD '98").
const CLUB_ABBR = {
  "Alavés": "ALA",
  "Albacete": "ALB",
  "Almería": "ALM",
  "Athletic Bilbao": "ATH",
  "Atlético Madrid": "ATM",
  "CD Logroñés": "LOG",
  "Castellón": "CAS",
  "Celta Vigo": "CEL",
  "Compostela": "COM",
  "Cádiz CF": "CAD",
  "Deportivo La Coruña": "DEP",
  "Espanyol": "ESP",
  "Extremadura": "EXT",
  "FC Barcelona": "BAR",
  "Getafe": "GET",
  "Gimnàstic": "GIM",
  "Hércules": "HER",
  "Las Palmas": "LPA",
  "Levante": "LEV",
  "Lleida": "LLE",
  "Mallorca": "MLL",
  "Murcia": "MUR",
  "Málaga": "MAL",
  "Mérida": "MER",
  "Numancia": "NUM",
  "Osasuna": "OSA",
  "Racing Santander": "RAC",
  "Rayo Vallecano": "RAY",
  "Real Betis": "BET",
  "Real Burgos": "BUR",
  "Real Madrid": "RMD",
  "Real Oviedo": "OVI",
  "Real Sociedad": "RSO",
  "Real Valladolid": "VLL",
  "Real Zaragoza": "ZAR",
  "Recreativo Huelva": "REC",
  "Salamanca": "SAL",
  "Sevilla": "SEV",
  "Sporting Gijón": "SPG",
  "Tenerife": "TEN",
  "Valencia": "VAL",
  "Villarreal": "VIL",
  "Xerez": "XER",
};

// Fallback abbreviation: first 3 letters of the last significant word, uppercased.
function deriveAbbr(name) {
  const words = name.replace(/[^A-Za-zÀ-ÿ ]/g, "").split(/\s+/).filter(Boolean);
  const base = words[words.length - 1] || name;
  return base.slice(0, 3).toUpperCase();
}

// Club display registry, derived from every club that appears in the real
// tables. Keyed by full club name; value carries the display name + short code.
// (Club names are the canonical identifier used across seasons, squads, engine.)
export const CLUBS = {};
for (const season of REAL_SEASONS) {
  for (const row of season.finalTable) {
    if (!CLUBS[row.club]) {
      CLUBS[row.club] = { name: row.club, abbr: CLUB_ABBR[row.club] || deriveAbbr(row.club) };
    }
  }
}
