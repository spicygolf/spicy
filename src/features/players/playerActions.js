
import { get } from 'common/api';

import {
  SET_CURRENT_USER
} from 'features/players/playerConstants';

import {
  upsertEntity
} from 'features/entities/entityActions';


export function fetchCurrentUser(store) {

  // TODO: get this user _key from local storage
  const userFromStorage = 'anderson';

  const uri = '/player/' + userFromStorage;

  return get(uri, async (player) => {
    let a = await store.dispatch(upsertEntity("Player", player._key, player));
    let b = await store.dispatch(setCurrentUser(player));
    return player;
  });

}


export function setCurrentUser(player) {
  return {
    type: SET_CURRENT_USER,
    payload: player
  };
}
