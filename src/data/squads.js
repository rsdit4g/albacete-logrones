// Squads keyed "CLUB|YEAR" (year = season start year, e.g. 1994 = 1994–95).
// v2 schema: pos is a single bucket GK/DF/MF/AT; attributes are the five
// Spanish ones. `media` = rounded average of the four base attributes.
//
// NOTE: rosters here are a representative real-era sample (mid-90s) to be
// verified/expanded against historical sources; attribute numbers are assigned
// ratings (no historical source exists), in the spirit of FIFA ratings.
function p(name, pos, age, vel, res, agr, cal) {
  return {
    name, pos, age,
    velocidad: vel, resistencia: res, agresividad: agr, calidad: cal,
    media: Math.round((vel + res + agr + cal) / 4),
  };
}

const FCB_1994 = [
  p("Zubizarreta", "GK", 32, 60, 80, 78, 86),
  p("Ferrer",      "DF", 29, 82, 84, 80, 80),
  p("Koeman",      "DF", 31, 62, 78, 82, 88),
  p("Nadal",       "DF", 28, 74, 86, 88, 80),
  p("Sergi",       "DF", 23, 86, 84, 80, 81),
  p("Guardiola",   "MF", 23, 66, 80, 74, 88),
  p("Bakero",      "MF", 31, 70, 82, 82, 83),
  p("Amor",        "MF", 27, 74, 84, 78, 82),
  p("Hagi",        "MF", 29, 78, 78, 76, 89),
  p("Stoichkov",   "AT", 28, 88, 82, 86, 90),
  p("Romário",     "AT", 28, 90, 76, 78, 92),
  p("Beguiristain","MF", 30, 76, 78, 72, 81),
  p("Eusebio",     "MF", 30, 70, 80, 78, 78),
];

const RMA_1994 = [
  p("Buyo",          "GK", 36, 56, 78, 80, 82),
  p("Chendo",        "DF", 33, 78, 82, 80, 78),
  p("Hierro",        "DF", 26, 74, 86, 86, 87),
  p("Sanchís",       "DF", 29, 76, 84, 82, 83),
  p("Lasa",          "DF", 30, 80, 82, 80, 78),
  p("Redondo",       "MF", 25, 76, 86, 78, 88),
  p("Luis Enrique",  "MF", 24, 86, 86, 86, 85),
  p("Míchel",        "MF", 31, 72, 80, 74, 86),
  p("Amavisca",      "MF", 23, 88, 80, 76, 80),
  p("Zamorano",      "AT", 27, 84, 84, 88, 87),
  p("Laudrup",       "AT", 30, 80, 80, 72, 90),
  p("Martín Vázquez","MF", 29, 74, 80, 76, 84),
  p("Quique",        "DF", 27, 80, 82, 82, 79),
];

const DEP_1994 = [
  p("Liaño",        "GK", 30, 60, 80, 78, 85),
  p("Voro",         "DF", 31, 76, 84, 84, 78),
  p("Djukić",       "DF", 28, 74, 86, 84, 82),
  p("Nando",        "DF", 30, 78, 84, 82, 80),
  p("López Rekarte","DF", 31, 80, 82, 80, 78),
  p("Fran",         "MF", 25, 82, 82, 76, 86),
  p("Mauro Silva",  "MF", 26, 74, 88, 84, 84),
  p("Aldana",       "MF", 28, 76, 82, 80, 80),
  p("Donato",       "MF", 32, 70, 82, 84, 83),
  p("Bebeto",       "AT", 30, 88, 82, 78, 89),
  p("Manjarín",     "AT", 24, 84, 80, 76, 82),
  p("Claudio",      "AT", 30, 82, 80, 78, 81),
  p("Naybet",       "DF", 28, 78, 84, 84, 82),
];

const LOG_1994 = [
  p("Alberto",  "GK", 28, 62, 76, 74, 72),
  p("Aitor",    "DF", 26, 80, 78, 76, 70),
  p("Juanito",  "DF", 29, 70, 80, 82, 72),
  p("Cuartero", "DF", 27, 72, 80, 80, 71),
  p("David",    "DF", 25, 82, 78, 74, 70),
  p("Ureña",    "MF", 24, 84, 76, 72, 73),
  p("Lozano",   "MF", 30, 66, 80, 80, 74),
  p("Ferrón",   "MF", 27, 74, 78, 74, 73),
  p("Quevedo",  "MF", 26, 80, 76, 72, 71),
  p("Ossório",  "AT", 28, 82, 78, 78, 76),
  p("Sanjuán",  "AT", 24, 84, 74, 74, 72),
  p("Mena",     "AT", 29, 78, 76, 76, 71),
  p("Nando R.", "DF", 23, 76, 76, 78, 69),
];

const ALB_1994 = [
  p("Molina",   "GK", 24, 64, 78, 76, 76),
  p("Corts",    "DF", 28, 76, 80, 80, 72),
  p("Bjelica",  "DF", 26, 72, 82, 82, 75),
  p("Antonio",  "DF", 30, 70, 80, 82, 72),
  p("Sergi A.", "DF", 25, 82, 78, 76, 71),
  p("Catali",   "MF", 27, 78, 80, 78, 75),
  p("Zalazar",  "MF", 31, 70, 78, 76, 80),
  p("Coco",     "MF", 29, 74, 82, 82, 74),
  p("Quique H.","MF", 26, 80, 78, 74, 72),
  p("Menéndez", "AT", 27, 80, 80, 80, 75),
  p("Pinilla",  "AT", 25, 82, 76, 76, 72),
  p("Dani",     "AT", 28, 78, 78, 78, 71),
  p("Soler",    "DF", 24, 74, 78, 80, 70),
];

// One-year-older copies keyed at 1995 for variety until full data lands.
function olderBy(squad, years) {
  return squad.map(x => ({ ...x, age: x.age + years }));
}

// Keys use the full club name (the canonical identifier) + season start year,
// matching the spellings in the real dataset so "you" replace your real row.
export const SQUADS = {
  "FC Barcelona|1994": FCB_1994,
  "Real Madrid|1994": RMA_1994,
  "Deportivo La Coruña|1994": DEP_1994,
  "CD Logroñés|1994": LOG_1994,
  "Albacete|1994": ALB_1994,
  "FC Barcelona|1995": olderBy(FCB_1994, 1),
  "Real Madrid|1995": olderBy(RMA_1994, 1),
  "Deportivo La Coruña|1995": olderBy(DEP_1994, 1),
  "Albacete|1995": olderBy(ALB_1994, 1),
};
