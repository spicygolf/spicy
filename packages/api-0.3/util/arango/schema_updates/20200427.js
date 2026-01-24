import { cloneDeep } from "lodash-es";
import { db } from "../../../src/db/db";

/*

  This update takes a game doc and transforms it such:

  game {
    holes: 'all18',
    teams: {
      rotate: 'never',
      holes: [ ... ],
    },
    ...
  }

  to

  game {
    scope: {
      holes: 'all18',
      teams_rotate: 'never',
    },
    holes: [ ... ],
    ...
  }

 */

const main = async () => {
  try {
    const collection = db.collection("games");
    const games = await collection.all();

    games.map(async (g) => {
      if (g.scope?.holes) return;
      const newG = cloneDeep(g);

      newG.scope = {
        holes: newG.holes,
        teams_rotate: newG.teams.rotate || "never",
      };
      newG.holes = newG.teams.holes || [];
      delete newG.teams;
      //console.log('newG', newG);
      collection.replace(newG._id, newG);
    });
  } catch (e) {
    console.log("error", e);
  }
};

main();
