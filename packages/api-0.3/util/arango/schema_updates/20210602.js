import { cloneDeep } from "lodash-es";
import { db } from "../../../src/db/db";
import { refreshEdge } from "../../../src/util/ghin";

/*

  This update takes a gamespec doc and strips out distinct option docs

  * to run in VSCode, go to its specific config in .vscode/launch.json
  * to run on cli, go to the root repo folder and run:
      > node --es-module-specifier-resolution=node ./util/arango/schema_updates/20210602.js

 */

const main = async () => {
  try {
    const oc = db.collection("options");
    const gsc = db.collection("gamespecs");
    const gamespecs = await gsc.all();

    gamespecs.map(async (gs) => {
      gs.options.map(async (o) => {
        const newO = {
          ...o,
          sub_type: o.type,
          type: "game",
        };
        let _id;
        let data = {};
        try {
          const res = await oc.save(newO);
          _id = res._id;
        } catch (_error) {
          const cursor = await oc.byExample({ name: newO.name, type: "game" });
          const res = await cursor.next();
          _id = res._id;
        }
        // Druid Hills Five Points 8x max off tee, except allow 16x off of 18 tee.
        if (o.name === "max_off_tee" && o._key === "76568433") {
          data = {
            values: [
              {
                value: 8,
                holes: [
                  "1",
                  "2",
                  "3",
                  "4",
                  "5",
                  "6",
                  "7",
                  "8",
                  "9",
                  "10",
                  "11",
                  "12",
                  "13",
                  "14",
                  "15",
                  "16",
                  "17",
                ],
              },
              { value: 16, holes: ["18"] },
            ],
          };
        }
        await refreshEdge("option2gamespec", _id, gs._id, data);
      });

      gs.junk.map(async (j) => {
        const newJ = {
          ...j,
          sub_type: j.type,
          type: "junk",
          default: j.value,
        };
        delete newJ.value;
        let _id;
        let data = {};
        try {
          const res = await oc.save(newJ);
          _id = res._id;
        } catch (_error) {
          const cursor = await oc.byExample({ name: newJ.name, type: "junk" });
          const res = await cursor.next();
          _id = res._id;
          // ex: low_ball, which is usually value/default = 1, but for 5pts it's 2
          if (res.value !== newJ.default) data = { default: newJ.default };
        }
        await refreshEdge("option2gamespec", _id, gs._id, data);
      });

      gs.multipliers.map(async (m) => {
        const newM = {
          ...m,
          type: "multiplier",
          default: m.value,
        };
        delete newM.value;
        let _id;
        try {
          const _res = await oc.save(newM);
          await refreshEdge("option2gamespec", _id, gs._id);
        } catch (_error) {
          const cursor = await oc.byExample({
            name: newM.name,
            type: "multiplier",
          });
          const res = await cursor.next();
          _id = res._id;
        }
        await refreshEdge("option2gamespec", _id, gs._id);
      });

      // now delete options, junk, multipliers from gamespec
      const newGS = cloneDeep(gs);
      delete newGS.options;
      delete newGS.junk;
      delete newGS.multipliers;
      gsc.replace(newGS._id, newGS);
    });

    // TODO: loop thru games to change to new 'values' format?
    // const gc = db.collection('games');
    // const games = await gc.all();
  } catch (e) {
    console.log("error", e);
  }
};

main();
