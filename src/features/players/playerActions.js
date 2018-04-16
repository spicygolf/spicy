
import { get } from 'common/api';

import {
  SET_CURRENT_USER
} from 'features/players/playerConstants';

import {
  upsertEntity
} from 'features/entities/entityActions';


export function fetchCurrentUser(store) {

  // TODO: get this user _key from local storage
  const userFromStorage = '9552287';
  const q = `query getPlayer($player: String!) {
    getPlayer(_key: $player) { name, short }
   }`;
  return get(q, {player: userFromStorage}).then((player) => {
    store.dispatch(upsertEntity("Player", player._key, player));
    store.dispatch(setCurrentUser(player));
  });

}


export function setCurrentUser(player) {
  return {
    type: SET_CURRENT_USER,
    payload: player
  };
}
