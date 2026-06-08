function table(...rows) {
  return rows.map(([club, pts]) => ({ club, pts }));
}

export const SEASONS = {
  1994: {
    divisionSize: 20,
    pointsForWin: 2,
    finalTable: table(
      ["FCB", 56], ["DEP", 53], ["RMA", 52], ["ZAR", 47], ["ATM", 45],
      ["SEV", 44], ["ESP", 43], ["VAL", 42], ["ATH", 41], ["TEN", 40],
      ["RSO", 38], ["RBE", 36], ["CEL", 35], ["SPG", 34], ["OVI", 33],
      ["VLL", 32], ["RAC", 31], ["LOG", 30], ["ALB", 29], ["COM", 24],
    ),
    topScorers: [
      { name: "Romário", club: "FCB", goals: 30 },
      { name: "Zamorano", club: "RMA", goals: 28 },
      { name: "Bakero", club: "FCB", goals: 17 },
      { name: "Kodro", club: "RSO", goals: 16 },
    ],
  },
  1995: {
    divisionSize: 20,
    pointsForWin: 3,
    finalTable: table(
      ["RMA", 55], ["DEP", 51], ["FCB", 51], ["RBE", 48], ["ESP", 47],
      ["ATM", 46], ["VAL", 45], ["ZAR", 44], ["TEN", 43], ["SEV", 40],
      ["RAC", 39], ["ATH", 38], ["RSO", 37], ["COM", 36], ["SPG", 35],
      ["OVI", 34], ["VLL", 33], ["CEL", 32], ["LOG", 30], ["ALB", 28],
    ),
    topScorers: [
      { name: "Zamorano", club: "RMA", goals: 28 },
      { name: "Pizzi", club: "TEN", goals: 24 },
      { name: "Alfonso", club: "RBE", goals: 17 },
      { name: "Kodro", club: "FCB", goals: 16 },
    ],
  },
};
