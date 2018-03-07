
import {
  fetchCurrentUser
} from 'features/players/playerActions';

import {
  fetchActiveGames
} from 'features/games/gameActions';


export function fetchInitialData(store) {

  // begin pre-fetching data from the server
  // dispatch proper actions when done w each.

  // App's current user/player
  fetchCurrentUser(store)
    .then((p) => {
      console.log('p', p);
      fetchActiveGames(store);
    })
    .catch((error) => console.error(error));

}
