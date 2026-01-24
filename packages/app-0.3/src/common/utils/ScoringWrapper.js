import { getGamespecKVs, getPreMultiplierTotal } from "common/utils/game";
import { get_score_value } from "common/utils/rounds";
import jsonLogic from "json-logic-js";
import { concat, filter, find, orderBy } from "lodash";

// a wrapper class containing functions about scoring and players and teams
// so we can inject them into JsonLogic as custom operators
class ScoringWrapper {
  constructor(game, scoring, currentHole) {
    this._game = game;
    this._scoring = scoring;
    this._currentHole = parseInt(currentHole, 10);
    this.betterPoints = getGamespecKVs(game, "better");

    for (const key in this.customs) {
      if (Object.hasOwn(this.customs, key)) {
        jsonLogic.add_operation(key, this.customs[key]);
      }
    }
  }

  logic = (expression, extra_vars) => {
    if (!expression?.replace) {
      console.log("expression error: ", expression);
      return false;
    }
    const replaced = expression.replace(/'/g, '"');
    const parsed = JSON.parse(replaced);
    this._extra_vars = extra_vars;
    const data = {
      ...extra_vars,
      scoring: this,
    };
    const ret = jsonLogic.apply(parsed, data);
    // console.log('logic expression', parsed);
    // console.log('logic data', data);
    // console.log('logic value', ret, extra_vars?.team?.team);
    return ret;
  };

  /*
   *     custom functions
   */

  getPrevHole = () => {
    const prev = find(this._scoring.holes, {
      hole: (this._currentHole - 1).toString(),
    });
    //console.log('prev', prev);
    return prev;
  };

  getCurrHole = () => {
    const curr = find(this._scoring.holes, {
      hole: this._currentHole.toString(),
    });
    //console.log('curr', curr);
    return curr;
  };

  // TODO: team arg can be taken out of logic expression, as it's in _extra_vars (usually)
  isTeamDownTheMost = (hole, team) => {
    if (!hole) {
      return true;
    }
    // use 'asc' if higher points is better, 'desc' if lower points is better
    let dir = "asc";
    if (this.betterPoints.includes("lower")) {
      dir = "desc";
    }
    // get rank 1 as the team 'down the most'
    const ranks = this._teamRanks(hole, dir);
    //console.log('isTeamDownTheMost ranks', ranks);
    const thisTeam = find(ranks, { team: team.team });
    if (!thisTeam) {
      return true;
    }
    return thisTeam.rank === 1;
  };

  // TODO: team arg can be taken out of logic expression, as it's in _extra_vars (usually)
  isTeamSecondToLast = (hole, team) => {
    if (!hole) {
      return false;
    }
    // use 'asc' if higher points is better, 'desc' if lower points is better
    let dir = "asc";
    if (this.betterPoints.includes("lower")) {
      dir = "desc";
    }
    // get rank 2 as the team 'down second most'
    const ranks = this._teamRanks(hole, dir);
    const thisTeam = find(ranks, { team: team.team });
    if (!thisTeam) {
      return true;
    }
    return thisTeam.rank === 2;
  };

  rankWithTies = (rank, teamsAtRank) => {
    let ret = true;
    const junk = this._extra_vars.junk;
    let dir = "asc";
    // TODO: do this from junk, not game 'better'
    if (junk.better !== "lower") {
      dir = "desc";
    }
    const teamScores = this._extra_vars.teams.map((t) => {
      try {
        return {
          team: t.team,
          score: parseFloat(t.players[0].score[junk.based_on].value),
        };
      } catch (e) {
        console.log(e);
      }
    });
    const ranks = this._getRanks(teamScores, dir);
    const team = this._extra_vars.team;
    const thisTeam = find(ranks, { team: team.team });
    if (thisTeam.rank !== rank) {
      ret = false;
    }
    const atRank = filter(ranks, { rank: rank }).length;
    if (!atRank || atRank !== teamsAtRank) {
      ret = false;
    }
    //console.log('rankWithTies', hole.hole, junk.name, ranks, thisTeam, atRank, rank, teamsAtRank, ret);
    return ret;
  };

  didOtherTeamMultiplyWith = (hole, thisTeam, multName) => {
    const gHole = find(this._game.holes, { hole: hole.hole });

    if (!gHole || !gHole.multipliers || !gHole.multipliers.length) {
      return false;
    }
    const targetMult = find(gHole.multipliers, { name: multName });
    if (!targetMult) {
      return false;
    }
    //console.log('targetMult', targetMult);
    if (targetMult.team === thisTeam.team) {
      return false;
    }
    return true;
  };

  countJunk = (team, junkName) => {
    let teamJunk = [];
    team.players.map((p) => {
      teamJunk = concat(teamJunk, p.junk);
    });
    const f = filter(teamJunk, { name: junkName });
    //console.log('countJunk', this._currentHole, teamJunk, f);
    if (!f) {
      return 0;
    }
    return f.length;
  };

  // team arg is 'this' or 'other'
  getTeam = (team = "this") => {
    let ret = null;
    if (team === "this") {
      ret = this._extra_vars.team;
    }
    if (team === "other") {
      const otherTeamIndex = this._extra_vars.team.team === "1" ? 1 : 0;
      ret = this._extra_vars.teams[otherTeamIndex];
    }
    //console.log('getTeam', team, ret);
    return ret;
  };

  // TODO: HoleJunk is sending TeeHole and Score in as _extra_vars, so in future
  //       we will need to read holeNum arg and maybe find the hole (for par)
  isParOrBetter = (_holeNum, scoreType = "gross") => {
    const score = this._extra_vars.score;
    let s = null;
    switch (scoreType) {
      case "gross":
      case "net":
        s = get_score_value(scoreType, score);
        break;
      default:
        break;
    }
    if (!s) {
      return false;
    }
    const p = parseInt(this._extra_vars.hole.par, 10);
    //console.log('isParOrBetter', s, p, (s <= p));
    return s <= p;
  };

  // TODO: HoleJunk is sending TeeHole and Score in as _extra_vars, so in future
  //       we will need to read holeNum arg and maybe find the hole (for par)
  holePar = (_holeNum) => {
    const p = parseInt(this._extra_vars.hole.par, 10);
    //console.log('holePar', p);
    return p;
  };

  playersOnTeam = (team) => {
    const t = this.getTeam(team);
    const ret = t?.players ? t.players.length : 0;
    //console.log('playersOnTeam', t, team, ret);
    return ret;
  };

  isWolfPlayer = (pkey) => {
    console.log("isWolfPlayer", pkey, this);
    return true;
  };

  existingPreMultiplierTotal = (hole, threshold) => {
    const tot = getPreMultiplierTotal(hole);
    // console.log('tot', tot);
    return tot >= threshold;
  };

  _teamRanks = (hole, dir) => {
    const teamScores = hole.teams.map((t) => ({
      team: t.team,
      score: t.runningTotal,
    }));
    return this._getRanks(teamScores, dir);
  };

  _getRanks = (teamScores, dir) => {
    const sorted = orderBy(teamScores, ["score"], [dir]);
    //console.log('sorted', sorted);
    const ranked = sorted.map((item, i) => {
      if (i > 0) {
        const prevItem = sorted[i - 1];
        if (prevItem.score === item.score) {
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

  // custom logic mapping... love that mixed case hotness
  customs = {
    team_down_the_most: this.isTeamDownTheMost,
    team_second_to_last: this.isTeamSecondToLast,
    rankWithTies: this.rankWithTies,
    other_team_multiplied_with: this.didOtherTeamMultiplyWith,
    getPrevHole: this.getPrevHole,
    getCurrHole: this.getCurrHole,
    team: this.getTeam,
    countJunk: this.countJunk,
    parOrBetter: this.isParOrBetter,
    holePar: this.holePar,
    playersOnTeam: this.playersOnTeam,
    isWolfPlayer: this.isWolfPlayer,
    existingPreMultiplierTotal: this.existingPreMultiplierTotal,
  };
}

export default ScoringWrapper;
