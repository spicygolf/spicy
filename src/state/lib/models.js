'use strict';

import { oneToOne, fk, many, attr, Model } from 'redux-orm';

import * as types from '../actions/types';


//
// Game
//

class Game extends Model {

  static reducer(action, Game, session) {

    switch( action.type ) {
      case types.SET_ACTIVE_GAMES:
        action.activeGames.map(game => {
          if( !game.rounds ) game.rounds = [];
          Game.create(game);
        });
        break;
      case types.SET_GAME_ROUNDS_PLAYERS:
        action.payload.gameRoundsPlayers.map(rps => {
          Game.withId(action.payload.game_id).rounds.add(rps.round._key);
        });
        break;
    }
    // return value is ignored
    return undefined;
  }

  static get modelName() { return 'Game'; }

  static get idAttribute() { return '_key'; }

  static get fields() {
    return {
      '_key': attr(),
      '_id': attr(),
      '_rev': attr(),
      name: attr(),
      start: attr(),
      gametype: attr(),
      rounds: many('Round', 'rounds')
    };
  }

  toString() {
    return `game: ${this.name}`;
  }
}


//
// Round
//

class Round extends Model {

  static reducer(action, Round, session) {

    switch( action.type ) {
      case types.SET_GAME_ROUNDS_PLAYERS:
        action.payload.gameRoundsPlayers.map(rps => {
          rps.round.player = rps.player._key; // fk player field
          Round.create(rps.round);
        });
        break;
      case types.ADD_POSTED_SCORE:
        const score = action.score;

        var r = Round.withId(score.round);
        var mergeObj = {
          'scores': Object.assign({}, r.scores)
        };
        mergeObj.scores[score.hole] = {
          ...score.values,
          'date': 'UTC date from moment'
        };
        r.update(mergeObj);

        break;
    }
    // return value is ignored
    return undefined;
  }

  static get modelName() { return 'Round'; }

  static get idAttribute() { return '_key'; }

  static get fields() {
    return {
      _key: attr(),
      _id: attr(),
      _rev: attr(),
      scores: attr(),
      player: fk('Player', 'rounds')
    };
  }

  toString() {
    return `round: ${this._key}`;
  }
}


//
// Player
//

class Player extends Model {

  static reducer(action, Player, session) {

    switch( action.type ) {
      case types.SET_GAME_ROUNDS_PLAYERS:
        action.payload.gameRoundsPlayers.map(rps => Player.create(rps.player));
        break;
    }
    // return value is ignored
    return undefined;
  }

  static get modelName() { return 'Player'; }

  static get idAttribute() { return '_key'; }

  static get fields() {
    return {
      id: attr(),
      name: attr()
    };
  }

  toString() {
    return `player: ${this.name}`;
  }
}


export {
  Game,
  Round,
  Player
};
