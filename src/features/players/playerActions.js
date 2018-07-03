

//
//  Do we make an <InitialData> component to do these?
//  Would that match the apollo-link-state tutorial vid better?
//


import { graphql } from 'react-apollo';
import {
  getCurrentUser
} from './graphql';

//import { get } from 'common/api';

import {
  SET_CURRENT_USER
} from 'features/players/playerConstants';

import {
  upsertEntity
} from 'features/entities/entityActions';


export function fetchCurrentUser() {


  return graphql(getCurrentUser, { player: userFromStorage });

/*
  const q = ``;

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
*/
}


export function setCurrentUser(player) {
  return {
    type: SET_CURRENT_USER,
    payload: player
  };
}
