import React, { createContext, useState } from 'react';

export const CurrentPlayerContext = createContext();

export const CurrentPlayerProvider = props => {

  const { children } = props;

  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentPlayerKey, setCurrentPlayerKey] = useState(null);
  const [token, setToken] = useState(null);

  return (
    <CurrentPlayerContext.Provider
      value={{
        currentPlayer,
        setCurrentPlayer,
        currentPlayerKey,
        setCurrentPlayerKey,
        token,
        setToken,
      }}
    >
      {children}
    </CurrentPlayerContext.Provider>
  );
};
