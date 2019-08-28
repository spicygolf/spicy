
let _gameSetupRef;

export const setGameSetupRef = (gameSetupRef) => {
  console.log('setGameSetupRef');
  _gameSetupRef = gameSetupRef;
};

// getters
export const getCurrentPlayerKey = () => (
  _gameSetupRef.getCurrentPlayerKey()
);

export const getGameKey = () => (
  _gameSetupRef.getGameKey()
);

// tees
export const renderCourseTee = (tee) => {
  return _gameSetupRef.renderCourseTee(tee);
};

export const renderFavoritesTee = (tee) => {
  return _gameSetupRef.renderFavoritesTee(tee);
};

// players
export const renderPlayer = (player) => {
  return _gameSetupRef.renderPlayer(player);
};

export const addPlayer = (pkey) => {
  _gameSetupRef.addPlayer(pkey);
};

export const removePlayer = (pkey) => {
  _gameSetupRef.removePlayer(pkey);
};
