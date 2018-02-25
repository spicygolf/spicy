'use strict';

import { many, attr, Model } from 'redux-orm';


export default class GameSpec extends Model {

  static get modelName() { return 'GameSpec'; }

  static get idAttribute() { return '_key'; }

  static get fields() {
    return {
      '_key': attr(),
      '_id': attr(),
      '_rev': attr(),
      name: attr(),
      type: attr(),
      scoring: attr(),
      options: attr()
    };
  }

  toString() {
    return `gamespec: ${this.name}`;
  }
};
