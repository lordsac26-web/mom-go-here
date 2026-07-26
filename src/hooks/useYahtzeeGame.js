import { useCallback, useMemo, useRef, useState } from "react";
import { ALL_CATEGORIES, calcScore, isYahtzee, UPPER_BONUS_TARGET, UPPER_BONUS_VALUE, UPPER_KEYS } from "@/lib/yahtzee/scoreRules";

const STARTING_DICE = [1, 1, 1, 1, 1];

export default function useYahtzeeGame({ onCategoryScored }) {
  const [dice, setDice] = useState(STARTING_DICE);
  const [held, setHeld] = useState([false, false, false, false, false]);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [isRolling, setIsRolling] = useState(false);
  const [scores, setScores] = useState({});
  const [yahtzeeBonus, setYahtzeeBonus] = useState(0);
  const [turn, setTurn] = useState(1);
  const isRollingRef = useRef(false);

  const upperSubtotal = useMemo(() => UPPER_KEYS.reduce((total, key) => total + (scores[key] || 0), 0), [scores]);
  const lowerSubtotal = useMemo(() => ALL_CATEGORIES.filter((key) => !UPPER_KEYS.includes(key)).reduce((total, key) => total + (scores[key] || 0), 0), [scores]);
  const upperBonusEarned = upperSubtotal >= UPPER_BONUS_TARGET;
  const totalScore = upperSubtotal + lowerSubtotal + yahtzeeBonus + (upperBonusEarned ? UPPER_BONUS_VALUE : 0);
  const gameOver = Object.keys(scores).length === ALL_CATEGORIES.length;
  const scorePreviews = useMemo(() => rollsLeft === 3 ? {} : Object.fromEntries(ALL_CATEGORIES.map((key) => [key, calcScore(key, dice)])), [dice, rollsLeft]);

  const beginRoll = useCallback(() => {
    if (isRollingRef.current || rollsLeft === 0) return false;
    isRollingRef.current = true;
    setIsRolling(true);
    return true;
  }, [rollsLeft]);

  const completeRoll = useCallback((results) => {
    setDice(results);
    setRollsLeft((value) => value - 1);
    setIsRolling(false);
    isRollingRef.current = false;
  }, []);

  const toggleHold = useCallback((index) => {
    if (rollsLeft === 3) return;
    setHeld((current) => current.map((value, currentIndex) => currentIndex === index ? !value : value));
  }, [rollsLeft]);

  const scoreCategory = useCallback((key) => {
    if (scores[key] !== undefined || rollsLeft === 3) return;
    const score = scorePreviews[key] ?? calcScore(key, dice);
    const bonusAwarded = isYahtzee(dice) && scores.yahtzee === 50 && key !== "yahtzee" ? 100 : 0;
    const nextScores = { ...scores, [key]: score };
    const nextUpperSubtotal = UPPER_KEYS.reduce((total, category) => total + (nextScores[category] || 0), 0);
    const upperBonusUnlocked = nextUpperSubtotal >= UPPER_BONUS_TARGET && upperSubtotal < UPPER_BONUS_TARGET;

    setScores(nextScores);
    if (bonusAwarded) setYahtzeeBonus((value) => value + bonusAwarded);
    setDice(STARTING_DICE);
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);
    setTurn((value) => value + 1);
    onCategoryScored?.({ key, score, bonusAwarded, upperBonusUnlocked, turn });
  }, [dice, onCategoryScored, rollsLeft, scorePreviews, scores, turn, upperSubtotal]);

  const reset = useCallback(() => {
    setDice(STARTING_DICE);
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);
    setScores({});
    setYahtzeeBonus(0);
    setTurn(1);
    setIsRolling(false);
    isRollingRef.current = false;
  }, []);

  return { dice, held, rollsLeft, isRolling, scores, yahtzeeBonus, turn, upperSubtotal, lowerSubtotal, upperBonusEarned, totalScore, gameOver, scorePreviews, beginRoll, completeRoll, toggleHold, scoreCategory, reset };
}