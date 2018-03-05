import { combineReducers } from 'redux';

import { reduceReducers } from 'common/utils/reducerUtils';

import entitiesReducer from './entitiesReducer';
import gameReducers from 'features/games/gameReducers';
import roundReducers from 'features/rounds/roundReducers';
import playerReducers from 'features/players/playerReducers';
import entityCrudReducer from 'features/entities/entityReducer';

const combinedReducer = combineReducers({
  entities: entitiesReducer,
  games: gameReducers,
  rounds: roundReducers,
  players: playerReducers
});

const rootReducer = reduceReducers(
  combinedReducer,
  entityCrudReducer
);

export default rootReducer;
