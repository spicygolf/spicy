'use strict';

import { attr, Model } from 'redux-orm';


export default class Player extends Model {

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
};
