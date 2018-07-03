'use strict';

import { get } from 'common/api';

import {
  createEntity,
  updateEntity,
  upsertEntity
} from 'features/entities/entityActions';

import {
  SET_CURRENT_GAME
} from 'features/games/gameConstants';

//
// active games
//
export function fetchActiveGames(client, store) {

  const state = store.getState();
  const pkey = state.players.currentUser._key;

  const q = `query ActiveGamesForPlayer($pkey: String!) {
    activeGamesForPlayer(pkey: $pkey) { _key name start end gametype }
   }`;

  return get(client, q, {pkey: pkey})
    .then((res) => {
      const games = res.data.activeGamesForPlayer;
      games.map((game) => {
        // TODO: upserts?  or clear out and replace?
        store.dispatch(upsertEntity("Game", game._key, game));
      });
    })
    .catch((e) => {
      console.error(e);
    });

}


//
// current game
//

export function setCurrentGame(game) {
  return {
    type: SET_CURRENT_GAME,
    payload: game
  };
}


export function storeRound(round) {
  return (dispatch, getState) => {
    // build proper round and player objects, and upsert them to state
    let r = Object.assign({}, round);
    let p = Object.assign({}, round.player[0]);
    // fk round -> player field
    r.player = p._key;
    // upserts
    dispatch(upsertEntity("Round", r._key, r));
    dispatch(upsertEntity("Player", p._key, p));
  };
}

export function storeRoundIDsInGame(gkey, round_ids) {
  return (dispatch, getState) => {
    dispatch(updateEntity("Game", gkey, { rounds: round_ids }));
  };
}


//
//  gamepecs
//
export function fetchGameSpecs(player) {

  return (dispatch, getState) => {

    const url = '/gamespecs?player=' + player;

    get(url)
      .then((gamespecs) => {
        gamespecs.map((gs) => {
          dispatch(upsertEntity("GameSpec", gs._key, gs));
        });
      });

  };

}
