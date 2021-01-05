import jsonLogic from 'json-logic-js';
import {
  concat,
  filter,
  find,
  orderBy
} from 'lodash';

import {
  getGamespecKVs,
} from 'common/utils/game';
import {
  get_score_value,
} from 'common/utils/rounds';
import { get_net_score } from './rounds';



// a wrapper class containing functions about scoring and players and teams
// so we can inject them into JsonLogic as custom operators
class ScoringWrapper {

  constructor(game, scoring, currentHole) {
    this._game = game;
    this._scoring = scoring;
    this._currentHole = parseInt(currentHole);
    this.betterPoints = getGamespecKVs(game, 'better');

    for( let key in this.customs ) {
      if( this.customs.hasOwnProperty(key) ) {
        jsonLogic.add_operation(key, this.customs[key]);
      }
    }
  }

  logic = ( expression, extra_vars ) => {
    if( !(expression && expression.replace) ) {
      console.log('expression error: ', expression);
      return false;
    }
    const replaced = expression.replace(/'/g, '"');
    const parsed = JSON.parse(replaced);
    this._extra_vars = extra_vars;
    const data = {
      ...extra_vars,
      scoring: this,
    };
    //console.log('logic expression', expression);
    //console.log('logic data', data);
    return jsonLogic.apply(parsed, data)
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
    // use 'asc' if higher points is better, 'desc' if lower points is better
    let dir = 'asc';
    if( this.betterPoints.includes('lower') ) dir = 'desc';
    // get rank 1 as the team 'down the most'
    const ranks = this._teamRanks(hole, dir);
    const thisTeam = find(ranks, {team: team.team});
    if( !thisTeam ) return true;
    return thisTeam.rank == 1;
  };

  isTeamSecondToLast = (hole, team) => {
    if( !hole ) return false;
    // use 'asc' if higher points is better, 'desc' if lower points is better
    let dir = 'asc';
    if( this.betterPoints.includes('lower') ) dir = 'desc';
    // get rank 2 as the team 'down second most'
    const ranks = this._teamRanks(hole, dir);
    const thisTeam = find(ranks, {team: team.team});
    if( !thisTeam ) return true;
    return thisTeam.rank == 2;
  };

  didOtherTeamMultiplyWith = (hole, thisTeam, multName) => {
    const gHole = find(this._game.holes, {hole: hole.hole});

    if( !gHole || !gHole.multipliers || !gHole.multipliers.length ) return false;
    const targetMult = find(gHole.multipliers, {name: multName});
    if( !targetMult ) return false;
    //console.log('targetMult', targetMult);
    if( targetMult.team == thisTeam.team ) return false;
    return true;
  };

  countJunk = (team, junkName) => {
    let teamJunk = [];
    team.players.map(p => {
      teamJunk = concat(teamJunk, p.junk)
    })
    const f = filter(teamJunk, {name: junkName});
    //console.log('countJunk', this._currentHole, teamJunk, f);
    if( !f ) return 0;
    return f.length;
  };

  // team arg is 'this' or 'other'
  getTeam = (team) => {
    let ret = null;
    if( team == 'this' ) ret = this._extra_vars.team;
    if( team == 'other' ) {
      const otherTeamIndex = (this._extra_vars.team.team === '1' ) ? 1 : 0;
      ret = this._extra_vars.teams[otherTeamIndex];
    }
    //console.log('getTeam', team, ret);
    return ret;
  };

  // TODO: HoleJunk is sending TeeHole and Score in as _extra_vars, so in future
  //       we will need to read holeNum arg and maybe find the hole (for par)
  isParOrBetter = (holeNum, scoreType = 'gross') => {
    const score = this._extra_vars.score;
    let s = null;
    switch(scoreType) {
      case 'gross':
        s = get_score_value(scoreType, score);
        break;
      case 'net':
        s = get_net_score(gross, score);
        break;
      default:
        break;
    }
    if( !s ) return false;
    const p = parseInt(this._extra_vars.hole.par);
    //console.log('isParOrBetter', s, p, (s <= p));
    return (s <= p);
  };

  // TODO: HoleJunk is sending TeeHole and Score in as _extra_vars, so in future
  //       we will need to read holeNum arg and maybe find the hole (for par)
  holePar = (holeNum) => {
    const p = parseInt(this._extra_vars.hole.par);
    //console.log('holePar', p);
    return p;
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

  // custom logic mapping
  customs = {
    'team_down_the_most': this.isTeamDownTheMost,
    'team_second_to_last': this.isTeamSecondToLast,
    'other_team_multiplied_with': this.didOtherTeamMultiplyWith,
    'getPrevHole': this.getPrevHole,
    'getCurrHole': this.getCurrHole,
    'team': this.getTeam,
    'countJunk': this.countJunk,
    'parOrBetter': this.isParOrBetter,
    'holePar': this.holePar,
  };


}

export default ScoringWrapper;
