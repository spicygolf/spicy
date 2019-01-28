let _gameSetupRef;

export const setGameSetupRef = (gameSetupRef) => {
  _gameSetupRef = gameSetupRef;
};

export const addCourse = (coursetee) => {
  _gameSetupRef._addCourse(coursetee);
};

export const addPlayer = (pkey) => {
  _gameSetupRef._addPlayer(pkey);
};
