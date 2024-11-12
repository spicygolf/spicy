import { co, CoList, CoMap } from "jazz-tools";
import { Player } from "./players";

// per-hole score object
export class Score extends CoMap {
  seq = co.number;
  values = co.ref(ListOfValues);
  history = co.ref(ListOfScoreUpdate);
}

// per-score value object (holding current)
export class Value extends CoMap {
  k = co.string;
  v = co.string;
  by = co.ref(Player);
  at = co.Date;
}

// history of score updates
export class ScoreUpdate extends CoMap {
  by = co.ref(Player);
  at = co.Date;
  old = co.ref(Value);
}

export class ListOfScores extends CoList.Of(co.ref(Score)) {}

export class ListOfValues extends CoList.Of(co.ref(Value)) {}

export class ListOfScoreUpdate extends CoList.Of(co.ref(ScoreUpdate)) {}
