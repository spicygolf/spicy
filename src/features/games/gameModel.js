'use strict';

import { many, attr, Model } from 'redux-orm';


export default class Game extends Model {

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
};
