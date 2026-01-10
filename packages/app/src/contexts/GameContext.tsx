import { createContext, type ReactNode, useContext, useState } from "react";

export type LeaderboardViewMode = "gross" | "net" | "points";
export type SettingsTab = "PlayersTab" | "TeamsTab" | "OptionsTab";

type GameContextType = {
  gameId: string | null;
  setGameId: (gameId: string | null) => void;
  currentHoleIndex: number;
  setCurrentHoleIndex: (index: number) => void;
  leaderboardViewMode: LeaderboardViewMode;
  setLeaderboardViewMode: (mode: LeaderboardViewMode) => void;
  settingsTab: SettingsTab;
  setSettingsTab: (tab: SettingsTab) => void;
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
