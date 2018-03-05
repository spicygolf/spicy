
import {
  fetchCurrentUser
} from 'features/players/playerActions';


export function fetchInitialData(store) {

  // begin pre-fetching data from the server
  // dispatch proper actions when done w each.

  // App's current user/player
  fetchCurrentUser(store);


}
