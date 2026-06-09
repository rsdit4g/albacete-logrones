// La Liga relegation structure by season, including the "promoción" (the
// relegation/promotion play-off La Liga used from 1986-87 until 1998-99, where
// teams just above the direct-drop zone played a two-legged tie against Segunda
// sides). From 1999-2000 the promoción was abolished and the bottom three go
// down directly.
//
// Returns { direct, promocion }:
//   direct    — number of bottom positions relegated directly
//   promocion — number of positions just above them that play the play-off
//
// Verified per season:
//   1990–94 (20): 19–20 direct, 17–18 promoción
//   1995-96 (22): 21–22 direct, 19–20 promoción
//   1996-97 (22): 19–22 direct, 18 promoción   (22→20 reduction: 5 left)
//   1997-98, 1998-99 (20): 19–20 direct, 17–18 promoción
//   1999-2000+ (20): 18–20 direct, no promoción
export function relegationInfo(startYear) {
  if (startYear >= 1999) return { direct: 3, promocion: 0 };
  if (startYear === 1996) return { direct: 4, promocion: 1 };
  return { direct: 2, promocion: 2 }; // promoción era, 20- and the 1995 22-team season
}
