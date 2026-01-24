import { db } from "../../../src/db/db";
import { refreshEdge } from "../../../src/util/database";

/*

  This update adds 12x to Five Points game

  * to run in VSCode, go to its specific config in .vscode/launch.json
  * to run on cli, go to the root repo folder and run:
      > node --es-module-specifier-resolution=node ./util/arango/schema_updates/20221220.js

  oddly, this is also starting up the API server and I can't figure out why.

 */

const main = async () => {
  try {
    const oc = db.collection("options");

    // 12x
    const twelve = {
      _key: "86799720",
      name: "twelve",
      disp: "12x",
      seq: 6,
      icon: "album",
      based_on: "user",
      scope: "hole",
      availability:
        "{'and': [ {'team_down_the_most': [{'getPrevHole': []},{'var': 'team'}] }, {'existingPreMultiplierTotal': [ {'getCurrHole': []}, 8 ]} ] }",
      type: "multiplier",
      default: 12,
      override: true,
    };

    let _id;
    try {
      const res = await oc.save(twelve);
      _id = res._id;
    } catch (_error) {} // do nothing if doc exists

    let oid = "options/86799720";
    let gsid = "gamespecs/65384954";
    await refreshEdge("option2gamespec", oid, gsid);

    // custom multiplier
    const custom = {
      _key: "87156278",
      name: "custom",
      disp: "Custom",
      seq: 7,
      icon: "album",
      based_on: "user",
      scope: "hole",
      availability:
        "{ 'team_down_the_most': [{'getPrevHole': []}, {'var': 'team'}] }",
      type: "multiplier",
      input_value: true,
      override: true,
    };

    try {
      const res = await oc.save(custom);
      _id = res._id;
    } catch (_error) {} // do nothing if doc exists

    oid = "options/87156278";
    gsid = "gamespecs/65384954";
    await refreshEdge("option2gamespec", oid, gsid);
  } catch (e) {
    console.log("error", e);
  }
};

main();
