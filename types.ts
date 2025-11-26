export enum AppStep {
  HOME = 'HOME',
  START = 'START',
  NAME = 'NAME',
  CAROUSEL = 'CAROUSEL',
  CARD_BACK = 'CARD_BACK', // When a specific card is open
  LIGHT_1 = 'LIGHT_1',
  LIGHT_2 = 'LIGHT_2',
  LIGHT_3 = 'LIGHT_3', // Final Question
  END = 'END',
}

export interface UserState {
  name: string;
  solvedCards: number[]; // IDs of solved cards
  finalSolved: boolean;
}

export interface CardConfig {
  id: number;
  answer: string;
}
