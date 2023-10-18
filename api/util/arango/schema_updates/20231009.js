import { db } from '../../../src/db/db';
import { next } from '../../../src/util/database';

/*

  This update accompanies course/tee rework and using GHIN API

  * to run on cli, go to `api` folder and run:
      > bun ./util/arango/schema_updates/20231009.js

 */

const main = async () => {
  try {

    // TODO: copy all tee docs into round docs first, before deleting docs and edges below

    // TODO: copy all player2tee "favorites" somewhere before deleting docs and edges below

    // remove collections
    const tees = db.collection('tees');
    await tees.drop();

    const associations = db.collection('associations');
    await associations.drop();

    const clubs = db.collection('clubs');
    await clubs.drop();

    const courses = db.collection('courses');
    await courses.drop();

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

    // remove all edges to clubs
    query = `
      FOR e IN edges
        FILTER e.type LIKE "%2club"
        REMOVE {_key: e._key} IN edges
    `;
    await next({query});

    query = `
      FOR e IN edges
        FILTER e.type LIKE "club2%"
        REMOVE {_key: e._key} IN edges
    `;
    await next({query});

  } catch (e) {
    console.log('error', e);
  }
};

main();
