import { createSelector } from 'redux-orm';
import orm from 'app/schema';


export const selectGames = createSelector(
  orm,
  state => state.entities,
  session => session.Game.all().toModelArray()
);

export const selectGameSpecs = createSelector(
  orm,
  state => state.entities,
  session => session.GameSpec.all().toModelArray()
);
