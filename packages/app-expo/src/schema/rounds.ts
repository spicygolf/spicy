import { co, CoMap } from "jazz-tools";
import { ListOfScores } from "@/schema/scores";

export class Round extends CoMap {
  created_at = co.Date;
  seq = co.number;
  handicap_index = co.string;
  scores = co.ref(ListOfScores);
  // posting = co.ref(Posting);
  // tees = co.ref(ListOfTees);
}
