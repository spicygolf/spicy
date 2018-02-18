import { createSelector } from 'redux-orm';
import orm from 'app/schema';


export const selectRoundsPlayers = createSelector(
  orm,
  state => state.entities,
  state => state.games.currentGame,
  (session, game) => session.Game.withId(game._key).rounds.toModelArray()
);

export const selectRound = createSelector(
  orm,
  state => state.entities,
  state => state.rounds.currentRound,
  (session, round) => session.Round.withId(round).ref
);
