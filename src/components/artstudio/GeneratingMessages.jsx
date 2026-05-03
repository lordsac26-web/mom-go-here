import { useState, useEffect } from "react";

const MESSAGES = [
  "Mixing the colors... 🎨",
  "Sketching the outline... ✏️",
  "Adding beautiful details... ✨",
  "Painting the background... 🖌️",
  "Finishing touches... 💫",
  "Almost ready... 🖼️",
];

export default function GeneratingMessages() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-xl font-bold text-foreground animate-pulse">
        {MESSAGES[index]}
      </p>
      <p className="text-sm text-muted-foreground">This usually takes 5-10 seconds</p>
    </div>
  );
}