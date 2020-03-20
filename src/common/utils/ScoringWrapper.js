import { find, orderBy } from 'lodash';


// a wrapper class containing functions about scoring and players and teams
// so we can inject them into  JsonLogic as custom operators
class ScoringWrapper {

  constructor(game, scoring, currentHole) {
    this._game = game;
    this._scoring = scoring;
    this._currentHole = parseInt(currentHole);
  }

  getPrevHole = () => {
    const prev = find(this._scoring.holes, {
      hole: (this._currentHole-1).toString()
    });
    //console.log('prev', prev);
    return prev;
  };

  getCurrHole = () => {
    const curr = find(this._scoring.holes, {
      hole: (this._currentHole).toString()
    });
    //console.log('curr', curr);
    return curr;
  };

  isTeamDownTheMost = (hole, team) => {
    if( !hole ) return true;
    // 'asc' order is to get rank 1 as the team 'down the most'
    const ranks = this._teamRanks(hole, 'asc');
    const thisTeam = find(ranks, {team: team.team});
    if( !thisTeam ) return true;
    return thisTeam.rank == 1;
  };

  isTeamSecondToLast = (hole, team) => {
    if( !hole ) return false;
    // 'asc' order is to get rank 2 as the team 'down second most'
    const ranks = this._teamRanks(hole, 'asc');
    const thisTeam = find(ranks, {team: team.team});
    if( !thisTeam ) return true;
    return thisTeam.rank == 2;
  };

  didOtherTeamMultiplyWith = (hole, thisTeam, multName) => {
    const gHole = find(this._game.teams.holes, {hole: hole.hole});

    if( !gHole || !gHole.multipliers || !gHole.multipliers.length ) return false;
    const targetMult = find(gHole.multipliers, {name: multName});
    if( !targetMult ) return false;
    //console.log('targetMult', targetMult);
    if( targetMult.team == thisTeam.team ) return false;
    return true;
  };

  _teamRanks = (hole, dir) => {
    const teamScores = hole.teams.map(t => ({
      team: t.team,
      score: t.runningTotal
    }));
    const sorted = orderBy(teamScores, ['score'], [dir]);
    //console.log('sorted', sorted);
    const ranked = sorted.map( (item, i) => {
      if( i > 0 ) {
        let prevItem = sorted[i - 1];
        if( prevItem.score == item.score ) {
          // same score, same rank
          item.rank = prevItem.rank;
        } else {
          // not same score, give the current iterated index + 1
          item.rank = i + 1;
        }
      } else {
        // first item takes the 1 rank
        item.rank = 1;
      }
      return item;
    });
    //console.log('ranked', ranked);
    return ranked;
  };

}

export default ScoringWrapper;
