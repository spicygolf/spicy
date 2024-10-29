import { db } from '../../../src/db/db';
import descriptions from './20221219.json' assert {type: 'json'};

/*

  This update adds descriptions to existing gamespecs

  * to run in VSCode, go to its specific config in .vscode/launch.json
  * to run on cli, go to the root repo folder and run:
      > node --es-module-specifier-resolution=node ./util/arango/schema_updates/20221219.js

  oddly, this is also starting up the API server and I can't figure out why.

 */

const main = async () => {
  try {
    const gsc = db.collection('gamespecs');
    const gamespecs = await gsc.all();

    gamespecs.map(async (gs) => {
      const newFields = descriptions[gs._key];
      const newGS = {
        ...gs,
        ...newFields,
      }
      delete newGS._id;
      delete newGS._rev;
      
      try {
        const res = await gsc.update(gs._key, newGS);
      } catch (error) {
        console.log('error', error.message);
      }
    });


  } catch (e) {
    console.log('error', e);
  }
};

main();
