// Helper to keep entries terse: p(name, positions, age, overall)
function p(name, positions, age, overall) {
  return { name, positions, age, overall, pac: 0, sho: 0, pas: 0, dri: 0, def: 0, phy: 0 };
}

const LOG_1994 = [
  p("Alberto",      ["GK"],        28, 74),
  p("Aitor",        ["RB","RWB"],  26, 72),
  p("Juanito",      ["CB"],        29, 73),
  p("Cuartero",     ["CB"],        27, 72),
  p("David",        ["LB","LWB"],  25, 71),
  p("Ureña",        ["RM","RW"],   24, 72),
  p("Lozano",       ["CM","CDM"],  30, 73),
  p("Ferrón",       ["CM","CAM"],  27, 72),
  p("Quevedo",      ["LM","LW"],   26, 71),
  p("Ossório",      ["ST","CF"],   28, 74),
  p("Sanjuán",      ["ST"],        24, 71),
  p("Nando",        ["CB","RB"],   23, 69),
  p("Iván",         ["CM"],        22, 68),
  p("Carlos",       ["GK"],        31, 70),
  p("Mena",         ["CF","ST"],   29, 70),
  p("Rubén",        ["RM","CM"],   20, 67),
];

const ALB_1994 = [
  p("Molina",       ["GK"],        24, 75),
  p("Corts",        ["RB"],        28, 72),
  p("Bjelica",      ["CB"],        26, 73),
  p("Antonio",      ["CB"],        30, 72),
  p("Sergi",        ["LB","LWB"],  25, 71),
  p("Catali",       ["RM","CM"],   27, 73),
  p("Zalazar",      ["CM","CAM"],  31, 74),
  p("Coco",         ["CDM","CM"],  29, 72),
  p("Quique",       ["LM","LW"],   26, 71),
  p("Menéndez",     ["ST","CF"],   27, 73),
  p("Pinilla",      ["ST"],        25, 71),
  p("Soler",        ["CB","CDM"],  24, 69),
  p("Vicente",      ["RB","RM"],   23, 68),
  p("Raúl",         ["GK"],        30, 69),
  p("Dani",         ["CF","ST"],   28, 70),
  p("Iñaki",        ["CM"],        21, 67),
];

export const SQUADS = {
  "LOG|1994": LOG_1994,
  "ALB|1994": ALB_1994,
  // 1995 reuses the same rosters one year older (representative);
  // replace with verified 1995 squads later.
  "LOG|1995": LOG_1994.map(x => ({ ...x, age: x.age + 1 })),
  "ALB|1995": ALB_1994.map(x => ({ ...x, age: x.age + 1 })),
};
