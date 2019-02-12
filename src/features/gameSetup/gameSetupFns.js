let _gameSetupRef;

export const setGameSetupRef = (gameSetupRef) => {
  _gameSetupRef = gameSetupRef;
};

export const getCurrentPlayerKey = () => (
  _gameSetupRef.getCurrentPlayerKey()
);

export const getGameKey = () => (
  _gameSetupRef.getGameKey()
);

export const renderCourseTee = (tee) => {
  return _gameSetupRef.renderCourseTee(tee);
};

export const renderFavoritesTee = (tee) => {
  return _gameSetupRef.renderFavoritesTee(tee);
};

export const addPlayer = (pkey) => {
  _gameSetupRef.addPlayer(pkey);
};

export const removePlayer = (pkey) => {
  _gameSetupRef.removePlayer(pkey);
};
