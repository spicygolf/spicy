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
          Game.create(game);
        });
        break;
      case types.SET_CURRENT_GAME:
        //session
        break;
      case types.SET_GAME_ROUNDS:
        action.gameRounds.map(round => {
          Round.createOrUpdate(round);
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
  toString() {
    return `round: ${this.id}`;
  }
}

Round.modelName = 'Round';

Round.fields = {
  id: attr(),
  scores: attr(),
  player: fk('Player', 'rounds')
};

//
// Player
//

class Player extends Model {
  toString() {
    return `player: ${this.name}`;
  }
}

Player.modelName = 'Player';

Player.fields = {
  id: attr(),
  name: attr()
};

export {
  Game,
  Round,
  Player
};
