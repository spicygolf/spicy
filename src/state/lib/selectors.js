import { createSelector } from 'redux-orm';
import orm from './orm';


const gamesSelector = createSelector(
  orm,
  session => session.Game.all().toModelArray()
);

export {
  gamesSelector
}
