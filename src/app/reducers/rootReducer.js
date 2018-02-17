import { combineReducers } from 'redux';

import { reduceReducers } from 'common/utils/reducerUtils';

import entitiesReducer from './entitiesReducer';
import gamesReducer from 'features/games/gameReducers';
import roundsReducer from 'features/rounds/roundReducers';
import entityCrudReducer from 'features/entities/entityReducer';

const combinedReducer = combineReducers({
  entities: entitiesReducer,
  games: gamesReducer,
  rounds: roundsReducer
});

const rootReducer = reduceReducers(
  combinedReducer,
  entityCrudReducer
);

export default rootReducer;
