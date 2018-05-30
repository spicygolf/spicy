
import { get } from 'common/api';

import {
  SET_CURRENT_USER
} from 'features/players/playerConstants';

import {
  upsertEntity
} from 'features/entities/entityActions';


export function fetchCurrentUser(client, store) {

  // TODO: get this user _key from local storage
  const userFromStorage = '11155149';    // local dev
  //const userFromStorage = '16257780'; // server

  const q = `query GetPlayer($player: String!) {
    getPlayer(_key: $player) { _key name short }
   }`;

  return get(client, q, {player: userFromStorage})
    .then(res => {
      const player = res.data.getPlayer;
      if( !player ) {
        // TODO: this shouldn't happen, as local storage should always
        //       have a valid user/player from the server.
        throw "Current user not found on server.";
      }
      store.dispatch(upsertEntity("Player", player._key, player));
      store.dispatch(setCurrentUser(player));
    })
    .catch(err => {
      console.error(err);
    });

}


export function setCurrentUser(player) {
  return {
    type: SET_CURRENT_USER,
    payload: player
  };
}
