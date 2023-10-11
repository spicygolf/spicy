import { db } from '../../../src/db/db';
import { next } from '../../../src/util/database';

/*

  This update accompanies course/tee rework and using GHIN API

  * to run on cli, go to `api` folder and run:
      > bun ./util/arango/schema_updates/20231009.js

 */

const main = async () => {
  try {

    // remove all tees
    const tees = db.collection('tees');
    await tees.drop();

    // remove all edges to tees
    let query = `
      FOR e IN edges
        FILTER e.type LIKE "%2tee"
        REMOVE {_key: e._key} IN edges
    `;
    await next({query});

    query = `
      FOR e IN edges
        FILTER e.type LIKE "tee2%"
        REMOVE {_key: e._key} IN edges
    `;
    await next({query});

  } catch (e) {
    console.log('error', e);
  }
};

main();
