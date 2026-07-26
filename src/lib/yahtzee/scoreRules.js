export const UPPER_KEYS = ["ones", "twos", "threes", "fours", "fives", "sixes"];
export const ALL_CATEGORIES = [...UPPER_KEYS, "threeofakind", "fourofakind", "fullhouse", "smallstraight", "largestraight", "yahtzee", "chance"];
export const UPPER_BONUS_TARGET = 63;
export const UPPER_BONUS_VALUE = 35;

export const CATEGORY_LABELS = {
  ones: "Ones", twos: "Twos", threes: "Threes", fours: "Fours", fives: "Fives", sixes: "Sixes",
  threeofakind: "3 of a Kind", fourofakind: "4 of a Kind", fullhouse: "Full House",
  smallstraight: "Small Straight", largestraight: "Large Straight", yahtzee: "YAHTZEE!", chance: "Chance",
};

export function calcScore(key, dice) {
  const counts = Array(7).fill(0);
  dice.forEach((die) => { counts[die] += 1; });
  const sum = dice.reduce((total, die) => total + die, 0);
  const values = counts.slice(1);
  if (UPPER_KEYS.includes(key)) return counts[UPPER_KEYS.indexOf(key) + 1] * (UPPER_KEYS.indexOf(key) + 1);
  if (key === "threeofakind") return values.some((count) => count >= 3) ? sum : 0;
  if (key === "fourofakind") return values.some((count) => count >= 4) ? sum : 0;
  if (key === "fullhouse") return values.includes(3) && values.includes(2) ? 25 : 0;
  if (key === "smallstraight") {
    const diceString = [...new Set(dice)].sort().join("");
    return ["1234", "2345", "3456"].some((run) => diceString.includes(run)) ? 30 : 0;
  }
  if (key === "largestraight") return ["12345", "23456"].includes([...new Set(dice)].sort().join("")) ? 40 : 0;
  if (key === "yahtzee") return values.includes(5) ? 50 : 0;
  return key === "chance" ? sum : 0;
}

export const isYahtzee = (dice) => dice.every((die) => die === dice[0]);