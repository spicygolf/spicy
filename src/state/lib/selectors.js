import { createSelector } from 'redux-orm';
import orm from './orm';


const gamesSelector = createSelector(
  orm,
  state => state.orm,
  session => session.Game.all().toModelArray()
);

const roundsPlayersSelector = createSelector(
  orm,
  state => state.orm,
  state => state.currentGame,
  (session, game) => session.Game.withId(game._key).rounds.toModelArray()
);

const roundSelector = createSelector(
  orm,
  state => state.orm,
  state => state.currentRound,
  (session, round) => session.Round.withId(round).ref
);

export {
  gamesSelector,
  roundsPlayersSelector,
  roundSelector
};
