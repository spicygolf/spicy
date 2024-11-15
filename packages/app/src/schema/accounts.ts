import { Account, CoMap, Profile, co } from "jazz-tools";
import { ListOfGames } from "@/schema/games";
import { ListOfGameSpecs } from "@/schema/gamespecs";

export class PlayerAccountRoot extends CoMap {
  games = co.ref(ListOfGames);
  specs = co.ref(ListOfGameSpecs)
  // TODO: link Player to this account somewhere (I think here, maybe in PlayerAccount?)
}

export class PlayerAccount extends Account {
  profile = co.ref(Profile);
  root = co.ref(PlayerAccountRoot);

  migrate(this: PlayerAccount, creationProps?: { name: string }) {
    super.migrate(creationProps);
    if (!this._refs.root) {
      this.root = PlayerAccountRoot.create(
        {
          games: ListOfGames.create([], { owner: this }),
          specs: ListOfGameSpecs.create([], { owner: this }),
        },
        { owner: this }
      );
    }
  }
}
