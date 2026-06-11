import { createContext, useContext } from 'react';
import type { GameState, LeaderboardEntry, ScoreSubmission } from './types';

interface GameContextValue {
  code: string;
  state: GameState | null;
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  notFound: boolean;
  error: string | null;
  serverOffsetMs: number;
  join: () => Promise<void>;
  submitScore: (s: ScoreSubmission) => Promise<void>;
  refresh: () => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGameContext(): GameContextValue | null {
  return useContext(GameContext);
}

export function GameProvider({ children }: { code: string; children: React.ReactNode }) {
  return <>{children}</>;
}
