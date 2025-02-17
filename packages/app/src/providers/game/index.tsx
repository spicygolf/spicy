import React, { createContext, useState } from 'react';
import { Game } from '@/schema/games';

export const GameContext = createContext<{
  game?: Game;
  setGame: (game: Game) => void;
}>({ game: undefined, setGame: () => {} });

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [game, setGame] = useState<Game | undefined>(undefined);

  return (
    <GameContext.Provider value={{ game, setGame }}>
      {children}
    </GameContext.Provider>
  );
};
