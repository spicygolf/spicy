import { createSelector } from 'redux-orm';
import orm from 'app/schema';


export const selectRoundsPlayers = createSelector(
  orm,
  state => state.orm,
  state => state.currentGame,
  (session, game) => session.Game.withId(game._key).rounds.toModelArray()
);

export const selectRound = createSelector(
  orm,
  state => state.orm,
  state => state.currentRound,
  (session, round) => session.Round.withId(round).ref
);
