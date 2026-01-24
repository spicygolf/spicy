import pkg from "date-fns-tz";
import { db } from "../db/db";

const { zonedTimeToUtc } = pkg;

class Doc {
  constructor(collection) {
    this._collection = collection;
    this._doc = {};
  }

  getTS() {
    return zonedTimeToUtc(new Date());
  }

  get() {
    return this._doc;
  }

  set(doc) {
    this._doc = doc;
  }

  async load(key) {
    // fetch from collection by key
    try {
      var d = await this._collection.lookupByKeys([key]);
      if (d?.[0]) {
        delete d[0]._rev;
        this._doc = d[0];
      }
    } catch (e) {
      console.error("doc.load error", e.message);
    }
    return this._doc;
  }

  async find(example) {
    const cursor = await this._collection.byExample(example);
    return await cursor.all();
  }

  async search(field, q) {
    // TODO: limit this to 50 results for now, fix with Elasticsearch?
    // TODO: also, deprecated as of ArangoDB 3.4, use FULLTEXT in AQL.
    return this._collection.fulltext(field, `prefix:${q}`, {
      limit: 50,
    });
  }

  async save(options) {
    try {
      return await this._collection.save(this._doc, options || {});
    } catch (e) {
      console.error("doc.save() error: ", e);
    }
  }

  async update(newValue, options) {
    try {
      return await this._collection.update(
        this._doc._key,
        newValue,
        options || {},
      );
    } catch (e) {
      console.error("doc.update() error: ", e);
    }
  }

  async upsert(newValue, example, options) {
    if (!example) {
      // console.log('using default example for upsert');
      example = { _key: newValue._key };
    }

    const existing = await this.find(example);
    if (existing?.length) newValue._key = existing[0]._key;

    this.set(newValue);
    return this.save({ ...options, overwrite: true });

    // old upsert

    if (!example) {
      // console.log('using default example for upsert');
      example = { _key: newValue._key };
    }
    const collectionName = this._collection.name;

    // AQL upsert query so we have transactions (not of arangjs coll. methods)
    // note, this stringify stuff is because collection name cannot be dynamic.
    // so, we don't do aql`` but actual javascript template literal ``
    const exampleS = JSON.stringify(example);
    const newValueS = JSON.stringify(newValue);
    const upsertAQL = `
      UPSERT ${exampleS}
      INSERT ${newValueS}
      UPDATE ${newValueS}
      IN ${collectionName}
      RETURN { doc: NEW, type: OLD ? 'update' : 'insert' }
    `;

    const cursor = await db.query(upsertAQL);
    const ret = await cursor.all();
    //console.log('upsert type', ret[0].type);
    return ret[0].doc;
  }

  async remove(key, opts) {
    return await this._collection.remove(key, opts || {});
  }
}

export { Doc };
