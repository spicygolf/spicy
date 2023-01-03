import { Doc } from './doc';
import { aql } from 'arangojs';
import { db } from '../db/db';

const collection = db.collection('gamespecs');


class GameSpec extends Doc {
  constructor() {
    super(collection);
  }

  async getOptions(gsID) {
    const cursor = await db.query(aql`
      FOR v, e
        IN 1..1
        ANY ${gsID}
        GRAPH 'games'
        FILTER e.type == 'option2gamespec'
        RETURN MERGE(v, {
          default: e.default ? e.default : v.default,
          values: e.values ? e.values : v.values
        })
    `);
    return await cursor.all();
  }

};

const _GameSpec = GameSpec;
export { _GameSpec as GameSpec };
