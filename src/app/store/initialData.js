
import {
  fetchCurrentUser
} from 'features/players/playerActions';

import {
  fetchActiveGames
} from 'features/games/gameActions';


export function fetchInitialData(client, store) {

  // begin pre-fetching data from the server
  // dispatch proper actions when done w each.

  // App's current user/player
  fetchCurrentUser(client, store)
    .then((p) => {
      fetchActiveGames(client, store);
    })
    .catch((error) => console.error(error));

}
