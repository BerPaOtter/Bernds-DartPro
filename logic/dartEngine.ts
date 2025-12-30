
import { Throw, Player, BotDifficulty } from '../types';

export const calculateThrowScore = (t: Throw): number => {
  return t.value * t.multiplier;
};

export const getCheckoutSuggestion = (score: number, dartsRemaining: number): string | null => {
  if (score > 170) return null;
  if (score === 170) return "T20 T20 D25";
  if (score === 50) return "D25";
  if (score <= 40 && score % 2 === 0) return `D${score / 2}`;
  return "Try to reduce score";
};

export const simulateBotThrow = (difficulty: BotDifficulty, target: number): Throw => {
  const rand = Math.random();
  let multiplier: 1 | 2 | 3 = 1;
  let value = target;

  switch (difficulty) {
    case BotDifficulty.LOW:
      if (rand < 0.6) value = Math.floor(Math.random() * 21);
      else if (rand < 0.8) multiplier = 1;
      else multiplier = (Math.random() > 0.9 ? 2 : 1) as 1 | 2;
      break;
    case BotDifficulty.MEDIUM:
      if (rand < 0.3) value = Math.floor(Math.random() * 21);
      else if (rand < 0.7) multiplier = 1;
      else multiplier = (Math.random() > 0.6 ? 3 : 2) as 2 | 3;
      break;
    case BotDifficulty.PRO:
      if (rand < 0.05) value = Math.floor(Math.random() * 21);
      else if (rand < 0.4) multiplier = 3;
      else if (rand < 0.7) multiplier = 1;
      else multiplier = 2;
      break;
  }

  return { multiplier, value };
};
