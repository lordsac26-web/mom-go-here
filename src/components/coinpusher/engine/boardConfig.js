export const BOARD_CONFIG = {
  coinRadius: 0.065,
  pegRadius: 0.022,
  minGap: 0.12,
  maxCoins: 80,
  gravity: 1100,
  fallSpeed: 0.55,
  bounceStrength: 0.45,
  friction: 0.92,
  fixedStep: 1 / 60,
  pegs: [
    { x: 0.5, z: 0.31 },
    { x: 0.37, z: 0.37 }, { x: 0.63, z: 0.37 },
    { x: 0.5, z: 0.43 },
    { x: 0.37, z: 0.49 }, { x: 0.63, z: 0.49 },
  ],
};