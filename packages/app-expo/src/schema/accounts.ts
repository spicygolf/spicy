import { Account, CoList, CoMap, Profile, co } from "jazz-tools";
import { ListOfGames } from "./games";

export class PlayerAccountRoot extends CoMap {
  games = co.ref(ListOfGames);
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
        },
        { owner: this }
      );
    }
  }
}
