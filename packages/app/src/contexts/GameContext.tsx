import { useCoState } from "jazz-tools/react-native";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useState,
} from "react";
import { Game } from "spicylib/schema";
import type { Scoreboard, ScoringContext } from "spicylib/scoring";
import { useScoreboard } from "@/hooks/useScoreboard";

export type LeaderboardViewMode = "gross" | "net" | "points";
export type SettingsTab = "PlayersTab" | "TeamsTab" | "OptionsTab";

/**
 * Unified resolve query for scoring-related screens (Leaderboard, Scoring).
 * Both screens share this same data to ensure consistent loading and avoid
 * the "warming up" effect where visiting one screen loads data for the other.
 */
const SCORING_RESOLVE = {
  name: true,
  start: true,
  scope: { teamsConfig: true },
  specs: {
    $each: {
      options: { $each: true },
    },
  },
  options: { $each: true }, // Game-level option overrides
  holes: {
    $each: {
      teams: {
        $each: {
          options: { $each: true }, // Needed for inherited multiplier checking (pre_double)
        },
      },
    },
  },
  players: {
    $each: {
      name: true,
      handicap: true,
      envs: true,
    },
  },
  rounds: {
    $each: {
      handicapIndex: true,
      courseHandicap: true,
      gameHandicap: true,
      round: {
        playerId: true,
        handicapIndex: true,
        scores: { $each: true },
        tee: { holes: true, ratings: true }, // holes for pops, ratings for course handicap
      },
    },
  },
} as const;

type GameContextType = {
  gameId: string | null;
  setGameId: (gameId: string | null) => void;
  currentHoleIndex: number;
  setCurrentHoleIndex: Dispatch<SetStateAction<number>>;
  leaderboardViewMode: LeaderboardViewMode;
  setLeaderboardViewMode: (mode: LeaderboardViewMode) => void;
  settingsTab: SettingsTab;
  setSettingsTab: (tab: SettingsTab) => void;
  // Shared game data for scoring screens
  scoringGame: Game | null;
  scoreboard: Scoreboard | null;
  scoringContext: ScoringContext | null;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

type GameProviderProps = {
  children: ReactNode;
};

export function GameProvider({ children }: GameProviderProps) {
  const [gameId, setGameId] = useState<string | null>(null);
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [leaderboardViewMode, setLeaderboardViewMode] =
    useState<LeaderboardViewMode>("gross");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("PlayersTab");

  // Load game with unified scoring resolve - useCoState directly to avoid circular dep with useGame
  const scoringGame = useCoState(
    Game,
    gameId ?? "",
    gameId
      ? {
          resolve: SCORING_RESOLVE,
        }
      : undefined,
  ) as Game | null;

  // Compute scoreboard once, shared by all scoring screens
  const scoreResult = useScoreboard(scoringGame);

  return (
    <GameContext.Provider
      value={{
        gameId,
        setGameId,
        currentHoleIndex,
        setCurrentHoleIndex,
        leaderboardViewMode,
        setLeaderboardViewMode,
        settingsTab,
        setSettingsTab,
        scoringGame,
        scoreboard: scoreResult?.scoreboard ?? null,
        scoringContext: scoreResult?.context ?? null,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
}
