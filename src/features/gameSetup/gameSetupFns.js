let _gameSetupRef;

export const setGameSetupRef = (gameSetupRef) => {
  _gameSetupRef = gameSetupRef;
};

export const getGameKey = () => (
  _gameSetupRef.getGameKey()
);

export const renderTee = (tee) => {
  return _gameSetupRef.renderTee(tee);
};

export const removeTee = () => {
  _gameSetupRef.removeCourse();
};

export const addPlayer = (pkey) => {
  _gameSetupRef.addPlayer(pkey);
};

export const removePlayer = (pkey) => {
  _gameSetupRef.removePlayer(pkey);
};
