import { createSelector } from 'redux-orm';
import orm from 'app/schema';


export const selectGames = createSelector(
  orm,
  state => state.orm,
  session => session.Game.all().toModelArray()
);
