let _gameSetupRef;

export const setGameSetupRef = (gameSetupRef) => {
  _gameSetupRef = gameSetupRef;
};

export const addCourse = (coursetee) => {
  _gameSetupRef._addCourse(coursetee);
};

export const removeCourse = () => {
  _gameSetupRef._removeCourse();
};

export const addPlayer = (pkey) => {
  _gameSetupRef._addPlayer(pkey);
};

export const removePlayer = (pkey) => {
  _gameSetupRef._removePlayer(pkey);
};
