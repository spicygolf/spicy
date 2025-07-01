import { Doc } from './doc';
import { db } from '../db/db';

const collection = db.collection('edges');

class Edge extends Doc {

  constructor(type) {
    super(collection);
    this._doc.type = type;
    this._doc.ts = this.getTS();
  }

  from_to(f, t) {
    this._doc._from = f;
    this._doc._to = t;
  }

  other(other) {
    if( other && Array.isArray(other) ) {
      other.map(kv => {
        // if v == '' delete it from edge
        if( kv.value === '' ) {
          delete this._doc[kv.key]
        } else {
          this._doc[kv.key] = kv.value;
        }
      });
    }
  }

}

export { Edge };
