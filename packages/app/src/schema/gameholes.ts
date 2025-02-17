import { co, CoList, CoMap } from 'jazz-tools';
import { ListOfTeams } from '@/schema/teams';

export class GameHole extends CoMap {
  hole = co.string;
  seq = co.number;
  teams = co.ref(ListOfTeams);
  // multipliers = co.ref(ListOfMultipliers);
}

export class ListOfGameHoles extends CoList.Of(co.ref(GameHole)) {}
