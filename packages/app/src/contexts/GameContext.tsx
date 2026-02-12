import { useCoState } from "jazz-tools/react-native";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useMemo,
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
  spec: { $each: { $each: true } }, // Working copy of options for scoring (preferred)
  specRef: { $each: { $each: true } }, // Catalog spec reference (fallback for legacy games)
  holes: {
    $each: {
      teams: {
        $each: {
          options: { $each: true }, // Needed for inherited multiplier checking (pre_double)
          rounds: {
            $each: {
              roundToGame: {
                round: true, // Needed for team playerIds (playerId is a primitive)
              },
            },
          },
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
        tee: { holes: { $each: true }, ratings: true }, // holes.$each for pops, ratings for course handicap
      },
    },
  },
} as const;

// --- Stable context: gameId + UI state (rarely changes) ---

interface GameIdContextType {
  gameId: string | null;
  setGameId: (gameId: string | null) => void;
  currentHoleIndex: number;
  setCurrentHoleIndex: Dispatch<SetStateAction<number>>;
  leaderboardViewMode: LeaderboardViewMode;
  setLeaderboardViewMode: (mode: LeaderboardViewMode) => void;
  settingsTab: SettingsTab;
  setSettingsTab: (tab: SettingsTab) => void;
}

const GameIdContext = createContext<GameIdContextType | undefined>(undefined);

// --- Scoring context: Jazz-reactive data (changes frequently during progressive loading) ---

interface GameScoringContextType {
  scoringGame: Game | null;
  scoreboard: Scoreboard | null;
  scoringContext: ScoringContext | null;
}

const GameScoringContext = createContext<GameScoringContextType | undefined>(
  undefined,
);

// --- Combined type for convenience (used by screens that need everything) ---

type GameContextType = GameIdContextType & GameScoringContextType;

interface GameProviderProps {
  children: ReactNode;
}

/**
 * Inner component that holds the Jazz subscription (useCoState) and provides
 * the scoring context. Because it receives `children` as a prop from the
 * stable GameProvider parent, re-renders from Jazz progressive loading
 * updates do NOT cascade to children — React skips re-rendering prop children
 * whose reference hasn't changed.
 */
function ScoringProvider({
  gameId,
  children,
}: {
  gameId: string | null;
  children: ReactNode;
}) {
  const scoringGame = useCoState(
    Game,
    gameId ?? undefined,
    gameId
      ? {
          resolve: SCORING_RESOLVE,
        }
      : undefined,
  ) as Game | null;

  const scoreResult = useScoreboard(scoringGame);

  const scoreboard = scoreResult?.scoreboard ?? null;
  const scoringContext = scoreResult?.context ?? null;

  const scoringValue = useMemo(
    (): GameScoringContextType => ({
      scoringGame,
      scoreboard,
      scoringContext,
    }),
    [scoringGame, scoreboard, scoringContext],
  );

  return (
    <GameScoringContext.Provider value={scoringValue}>
      {children}
    </GameScoringContext.Provider>
  );
}

export function GameProvider({ children }: GameProviderProps) {
  const [gameId, setGameId] = useState<string | null>(null);
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [leaderboardViewMode, setLeaderboardViewMode] =
    useState<LeaderboardViewMode>("points");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("PlayersTab");

  const idValue = useMemo(
    (): GameIdContextType => ({
      gameId,
      setGameId,
      currentHoleIndex,
      setCurrentHoleIndex,
      leaderboardViewMode,
      setLeaderboardViewMode,
      settingsTab,
      setSettingsTab,
    }),
    [
      gameId,
      setGameId,
      currentHoleIndex,
      setCurrentHoleIndex,
      leaderboardViewMode,
      setLeaderboardViewMode,
      settingsTab,
      setSettingsTab,
    ],
  );

  return (
    <GameIdContext.Provider value={idValue}>
      <ScoringProvider gameId={gameId}>{children}</ScoringProvider>
    </GameIdContext.Provider>
  );
}

/**
 * Subscribe to stable game state (gameId + UI state).
 * Does NOT re-render when scoringGame/scoreboard change from Jazz progressive loading.
 * Use this in components that only need gameId, hole index, or view mode.
 */
export function useGameIdContext(): GameIdContextType {
  const context = useContext(GameIdContext);
  if (context === undefined) {
    throw new Error("useGameIdContext must be used within a GameProvider");
  }
  return context;
}

/**
 * Subscribe to all game context (stable state + scoring data).
 * Re-renders on Jazz progressive loading updates.
 * Use this in scoring screens that need scoringGame/scoreboard.
 */
export function useGameContext(): GameContextType {
  const idContext = useContext(GameIdContext);
  const scoringContext = useContext(GameScoringContext);
  if (idContext === undefined || scoringContext === undefined) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return useMemo(
    () => ({ ...idContext, ...scoringContext }),
    [idContext, scoringContext],
  );
}
