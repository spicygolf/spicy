import { createContext, type ReactNode, useContext, useState } from "react";
import type { Game } from "@/schema/games";

type GameContextType = {
  game: Game | null;
  setGame: (game: Game | null) => void;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

type GameProviderProps = {
  children: ReactNode;
};

export function GameProvider({ children }: GameProviderProps) {
  const [game, setGame] = useState<Game | null>(null);

  return (
    <GameContext.Provider value={{ game, setGame }}>
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
