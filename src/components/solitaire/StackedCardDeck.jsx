import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDesign } from "./cardBackDesigns";

/**
 * StackedCardDeck — A "react-placards" inspired stacked card effect for Solitaire.
 * 
 * Shows a deck of cards stacked with 3D depth, offset shadows, and smooth
 * cycling animations when cards are drawn. The top card flies out revealing
 * the next card beneath with a spring animation.
 * 
 * Props:
 *   stockCount  – number of cards remaining in the stock
 *   onDraw      – callback when user taps to draw a card
 *   drawKey     – changes on every draw to trigger the exit animation
 */

// Visual config
const STACK_LAYERS = 4;         // visible stacked cards behind the top
const LAYER_OFFSET_Y = 2.5;    // px shift down per layer
const LAYER_OFFSET_X = 1.5;    // px shift right per layer  
const LAYER_SCALE_STEP = 0.03; // scale shrink per layer

// Layer colors are now derived from the selected design

// Card back pattern now uses the design's pattern
function CardBackPattern({ design, opacity = 0.1 }) {
  const Pattern = design.pattern;
  return (
    <svg className="absolute inset-0 w-full h-full" style={{ opacity }} viewBox="0 0 40 40">
      <Pattern />
      <rect width="40" height="40" fill={`url(#${design.patternId})`} />
    </svg>
  );
}

function StackLayer({ index, totalLayers, design }) {
  const depth = totalLayers - index;
  const offsetY = depth * LAYER_OFFSET_Y;
  const offsetX = depth * LAYER_OFFSET_X;
  const scale = 1 - depth * LAYER_SCALE_STEP;
  const shadowOpacity = 0.15 + depth * 0.08;

  return (
    <motion.div
      className={`absolute inset-0 rounded-lg sm:rounded-xl overflow-hidden border ${design.borderColor}/60`}
      initial={{ y: offsetY + 10, x: offsetX + 5, scale: scale - 0.05, opacity: 0 }}
      animate={{ y: offsetY, x: offsetX, scale, opacity: 1 }}
      transition={{ type: "spring", stiffness: 250, damping: 22, delay: index * 0.04 }}
      style={{
        zIndex: -depth,
        boxShadow: `${offsetX}px ${offsetY + 2}px ${4 + depth * 3}px rgba(0,0,0,${shadowOpacity})`,
      }}
    >
      <div className={`w-full h-full bg-gradient-to-br ${design.gradient}`}>
        <div className={`absolute inset-1 rounded-md border ${design.innerBorder}`} />
        <CardBackPattern design={design} opacity={0.06 - depth * 0.01} />
      </div>
    </motion.div>
  );
}

export default function StackedCardDeck({ stockCount, onDraw, drawKey, cardBackKey }) {
  const design = getDesign(cardBackKey);
  const [exitDirection, setExitDirection] = useState(1);
  const prevKey = useRef(drawKey);

  // Alternate exit direction for variety
  useEffect(() => {
    if (drawKey !== prevKey.current) {
      setExitDirection(prev => prev * -1);
      prevKey.current = drawKey;
    }
  }, [drawKey]);

  const showLayers = Math.min(stockCount, STACK_LAYERS);
  const isEmpty = stockCount === 0;

  return (
    <motion.div
      onClick={onDraw}
      className="relative w-full aspect-[5/7] cursor-pointer select-none"
      whileTap={{ scale: 0.92 }}
      style={{ perspective: 600 }}
    >
      {/* Stacked layers behind the top card */}
      {!isEmpty && Array.from({ length: showLayers }).map((_, i) => (
        <StackLayer key={`layer-${i}`} index={i} totalLayers={showLayers} design={design} />
      ))}

      {/* Top card with draw animation */}
      <AnimatePresence mode="popLayout">
        {!isEmpty ? (
          <motion.div
            key={`top-${drawKey}`}
            className={`absolute inset-0 rounded-lg sm:rounded-xl overflow-hidden border-2 ${design.borderColor} shadow-xl`}
            initial={{ y: 0, x: 0, scale: 1, rotateZ: 0, opacity: 1 }}
            animate={{
              y: 0,
              x: 0,
              scale: 1,
              rotateZ: 0,
              opacity: 1,
              transition: { type: "spring", stiffness: 350, damping: 26 },
            }}
            exit={{
              x: exitDirection * 80,
              y: -30,
              rotateZ: exitDirection * 15,
              scale: 0.8,
              opacity: 0,
              transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
            }}
            style={{ zIndex: 10 }}
          >
            <div className={`w-full h-full bg-gradient-to-br ${design.gradient} flex items-center justify-center`}>
              <div className={`absolute inset-1 rounded-md border ${design.innerBorder}`} />
              <div className={`absolute inset-2 rounded-sm border ${design.innerBorder2}`} />
              <CardBackPattern design={design} />
              <span className="text-xl sm:text-2xl relative z-10">🂠</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty-deck"
            className="absolute inset-0 rounded-lg sm:rounded-xl border-2 border-dashed border-green-500 flex items-center justify-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <span className="text-lg sm:text-2xl text-green-500">↩</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card count badge */}
      {stockCount > 0 && (
        <motion.div
          className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] sm:text-[11px] font-black min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px] rounded-full flex items-center justify-center shadow-md border border-primary-foreground/20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          key={stockCount}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          style={{ zIndex: 20 }}
        >
          {stockCount}
        </motion.div>
      )}
    </motion.div>
  );
}