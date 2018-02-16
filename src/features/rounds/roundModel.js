'use strict';

import { fk, attr, Model } from 'redux-orm';

export default class Round extends Model {

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
};
