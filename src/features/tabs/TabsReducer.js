import { Reducer } from 'react-native-router-flux';

// TODO: maybe do some currentTab and initialState, like in:
//       https://github.com/markerikson/project-minimek/blob/master/src/features/tabs/tabReducer.js


const createTabsReducer = params => {
  const defaultReducer = new Reducer(params);
  return (state, action) => {
    return defaultReducer(state, action);
  };
};

export default createTabsReducer;
