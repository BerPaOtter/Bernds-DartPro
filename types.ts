
export enum GameMode {
  X01 = 'X01',
  CRICKET = 'CRICKET',
  ELIMINATION = 'ELIMINATION'
}

export enum CheckMode {
  STRAIGHT = 'STRAIGHT',
  DOUBLE = 'DOUBLE',
  TRIPLE = 'TRIPLE',
  MASTER = 'MASTER' // Double or Triple
}

export enum MatchMode {
  FIRST_TO = 'FIRST_TO',
  BEST_OF = 'BEST_OF'
}

export enum BotDifficulty {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  PRO = 'PRO'
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  isBot: boolean;
  botDifficulty?: BotDifficulty;
  selected?: boolean; 
}

export interface Throw {
  multiplier: 1 | 2 | 3;
  value: number; // 0 to 20, or 25 (Bull)
  isBust?: boolean;
}

export interface Turn {
  playerId: string;
  throws: Throw[];
  scoreAtStart: number;
}

export interface GameSettings {
  mode: GameMode;
  targetScore: number;
  checkIn: CheckMode;
  checkOut: CheckMode;
  matchMode: MatchMode;
  legs: number;
  sets: number;
  welpenschutz?: boolean;
  cricketBullseye?: boolean;
  eliminationSpecials?: {
    tripleSpecial: boolean;
    surprise: boolean;
  };
}

export interface GameState {
  players: Player[];
  settings: GameSettings;
  currentTurnIndex: number;
  currentPlayerIndex: number;
  turns: Turn[];
  winners: string[];
  isFinished: boolean;
  startTime: number;
  currentLeg: number;
  currentSet: number;
}

export interface PlayerStats {
  playerId: string;
  average: number;
  first9Average: number;
  checkoutPercentage: number;
  highestFinish: number;
  totalGames: number;
  wins: number;
}
