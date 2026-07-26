import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import YahtzeeDie from "@/components/yahtzee/YahtzeeDie";

const Dice2DRoller = forwardRef(function Dice2DRoller({ onRollComplete, held, onToggleHold }, ref) {
  const [dice, setDice] = useState([1, 1, 1, 1, 1]);
  const [rolling, setRolling] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const diceRef = useRef(dice);
  diceRef.current = dice;

  useImperativeHandle(ref, () => ({
    roll: () => {
      if (rolling) return;
      setRolling(true);
      intervalRef.current = setInterval(() => setDice((current) => current.map((die, index) => held[index] ? die : Math.floor(Math.random() * 6) + 1)), 80);
      timeoutRef.current = setTimeout(() => {
        clearInterval(intervalRef.current);
        const finalDice = held.map((isHeld, index) => isHeld ? diceRef.current[index] : Math.floor(Math.random() * 6) + 1);
        setDice(finalDice);
        setRolling(false);
        onRollComplete(finalDice);
      }, 600);
    },
  }), [held, onRollComplete, rolling]);

  useEffect(() => () => {
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-3">
      {dice.map((value, index) => <YahtzeeDie key={index} value={value} held={held[index]} rolling={rolling && !held[index]} onClick={() => onToggleHold?.(index)} />)}
    </div>
  );
});

export default Dice2DRoller;