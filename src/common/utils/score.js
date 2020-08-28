import { cloneDeep, filter, find, findIndex, max, orderBy, reduce } from 'lodash';
import moment from 'moment';

import ScoringWrapper from 'common/utils/ScoringWrapper';
import {
  getGamespecKVs,
  getHoles,
  getJunk,
  getOption,
} from 'common/utils/game';
import {
  get_hole,
  get_net_score,
  get_round_for_player,
  get_score,
  get_score_value,
  get_pops,
} from './rounds';



export const getScoringFromGamespecs = ({gamespecs, scoringType}) => {
  let ret = [];
  gamespecs.map(gs => {
    const { scoring } = gs;
    if( !scoring || !scoring[scoringType] ) return;
    scoring[scoringType].map(s => {
      ret.push({
        ...s,
        key: `${gs._key}_${s.name}`,
      });
    });
  });
  return ret;
};

export const getJunkFromGamespecs = gamespecs => {
  let ret = [];
  gamespecs.map(gs => {
    const { junk } = gs;
    if( !junk ) return;
    junk.map(j => {
      ret.push({
        ...j,
        key: `${gs._key}_${j.name}`,
      });
    });
  });
  return ret;
};

export const getMultipliersFromGamespecs = gamespecs => {
  let ret = [];
  gamespecs.map(gs => {
    const { multipliers } = gs;
    if( !multipliers ) return;
    multipliers.map(m => {
      ret.push({
        ...m,
        key: `${gs._key}_${m.name}`,
      });
    });
  });
  return ret;
};


// This is the main scoring function for the app
//
// It's basically a shit-show of maps/loops through different data structures,
// coupled with a metric fuck-tonne of conditionals.
// My guess is that this version is horribly inefficient and is eating phone
// battery.  Also, I really do pity the poor fuck who will eventually have to
// refactor this function and its offshoots.
//
export const scoring = game => {

  const { gamespecs } = game;
  const allJunk = getJunkFromGamespecs(gamespecs);
  const allmultipliers = getMultipliersFromGamespecs(gamespecs);
  const teamGame = getGamespecKVs(game, 'teams').includes(true);

  // player scoring
  let players = game.players.map(p => {
    const round = get_round_for_player(game.rounds, p._key);
    const ch = parseFloat(round.course_handicap);
    return ({
      pkey: p._key,
      name: p.name,
      gross: 0.0,
      grossToPar: 0.0,
      net: 0.0,
      netToPar: 0.0,
      points: 0.0,
      netPoints: 0.0,
      courseHandicap: ch,
      holesScored: 0,
    });
  });

  let ret = {
    holes: [],
    players,
  };

  const holes = getHoles(game);
  holes.map(hole => {
    //console.log(`scoring hole '${hole}'   ***********************************`);

    const gHole = find(game.holes, {hole: hole});
    //console.log('gHole', gHole);
    if( !gHole ) return;

    let teams = [];
    let scoresEntered = 0;

    // begin possiblePoints calcs
    let possiblePoints = 0;
    allJunk.map(gsJunk => {
      if( gsJunk.limit == 'one_team_per_group' ||
          gsJunk.limit == 'one_per_group' ) {
        possiblePoints += gsJunk.value;
      }
    });

    teams = gHole.teams.map(gTeam => {
      let teamPoints = 0;
      let team = {
        team: gTeam.team,
        players: gTeam.players.map(gPlayer => {
          const pkey = gPlayer;
          const {p, tp, pp} = calcPlayerJunk({players, pkey, game, hole, allJunk});
          teamPoints += tp;
          possiblePoints += pp;
          if( p && p.score && p.score.gross && p.score.gross.value ) ++scoresEntered;
          return p;
        }),
        score: [],
        junk: [],
        points: teamPoints,
        holeTotal: 0,
        runningTotal: 0,
        matchDiff: 0,
        matchOver: false,
      };
      team = calcTeamScore({team, allJunk});
      //console.log('team', team);
      return team;
    });

    teams = calcTeamJunk({teams, allJunk, game, scoresEntered});

    //  junk that depends on team score or something after the above calcs
    //  something like 'ky' or 'oj' in wolfhammer

    //if( hole == '1' ) console.log('teams', teams);

    const oneHoleScoring = {
      holes: [{
        hole: hole,
        teams: teams,
      }],
    };
    const scoringWrapper = new ScoringWrapper(game, oneHoleScoring, hole)

    // multipliers
    const multipliers = [];
    allmultipliers.map(gsMult => {
      if( gsMult.based_on == 'user' ) {
        if( gHole && gHole.multipliers ) {
          //console.log('scoring gHole', gHole);
          filter(gHole.multipliers, {name: gsMult.name}).map(mult => {
            multipliers.push({
              ...gsMult,
              team: mult.team,
            });
          });
        }
      } else {
        // loop thru teams and players to see if this multiplier is achieved
        teams.map(t => {
          t.players.map(p => {
            const j = find(p.junk, {name: gsMult.based_on});
            if( j ) {
              try {
                const replaced = gsMult.availability.replace(/'/g, '"');
                const availability = JSON.parse(replaced);
                const logic = scoringWrapper.logic(availability, {
                  team: t,
                  possiblePoints: possiblePoints,
                });
                //console.log(hole, j.name, logic, t);
                if( logic ) {
                  multipliers.push({
                    ...gsMult,
                    team: t.team,
                  });
                }
              } catch( e ) {
                console.log('logic error', e);
              }
            }
          });
        });
      }
    });

    // hole totals
    const holeMultiplier = reduce(multipliers, (tot, m) => (tot * m.value), 1);
    //console.log('holeMultiplier', hole, holeMultiplier);
    teams.map(t => {
      const holeTotal = t.points * holeMultiplier;
      t.holeTotal = holeTotal;
      // give points to players on this team
      t.players.map(p => {
        p.score.points.value = holeTotal;
        incrementPlayer(players, p.pkey, 'points', holeTotal);
      });
    });
    if( teams.length == 2 ) {
      // calculate net total points
      teams.map(t => {
        const otherTeamIndex = (t.team === '1' ) ? 1 : 0;
        let holeNetTotal = t.holeTotal - teams[otherTeamIndex].holeTotal;
        t.holeNetTotal = holeNetTotal;
        // give points to players on this team
        t.players.map(p => {
          p.score.points.value = t.holeNetTotal; // overwrite holeTotal points in 2-team
          incrementPlayer(players, p.pkey, 'netPoints', t.holeNetTotal);
        });
      });
    }

    // warnings
    let warnings = [];
    let markedJunk = 0, requiredJunk = 0;
    allJunk.map(junk => {
      if( junk.scope == 'player' && junk.limit == 'one_per_group' ) {
        ++requiredJunk;
        teams.map(t => {
          t.players.map(p => {
            if( find(p.junk, {name: junk.name}) ) ++markedJunk;
          });
        });
      }
    });
    if( markedJunk < requiredJunk && game.players.length == scoresEntered ) {
      warnings.push('Mark all possible points');
    }

    // hole scoring
    ret.holes.push({
      hole,
      teams,
      multipliers,
      holeMultiplier,
      possiblePoints,
      scoresEntered,
      markedJunk,
      requiredJunk,
      warnings,
    });

  });

  // loop thru holes, calculating runningTotal, match for each team
  let allHolesScoredSoFar = true;
  let isMatchOver = false;
  let matchResult = '';
  let winningTeam = null;
  ret.holes.map((h, i) => {
    // see if this hole is fully-scored
    if(  h.scoresEntered < game.players.length ) allHolesScoredSoFar = false;

    // runningTotal
    h.teams.map(t => {
      let lastHoleRunningTotal = ( i == 0 ) ? 0
        : find(ret.holes[i-1].teams, {team: t.team}).runningTotal;
      //console.log('lastHoleRunningTotal', lastHoleRunningTotal, 't', t);
      t.runningTotal = ( game.players.length == h.scoresEntered )
        ? lastHoleRunningTotal + t.holeTotal
        : lastHoleRunningTotal;
      //console.log('teamTotals', h.hole, t.runningTotal);
    });

    // match
    if( h.teams.length == 2 ) {
      h.teams.map(t => {
        if( isMatchOver ) {
          t.matchDiff = matchResult;
          t.matchOver = true;
          if( t.team === winningTeam ) t.win = true;
          return;
        }
        const otherTeamIndex = (t.team === '1' ) ? 1 : 0;
        const diff = t.runningTotal - h.teams[otherTeamIndex].runningTotal;
        const holesRemaining = ret.holes.length - i - 1;
        if( diff > holesRemaining && allHolesScoredSoFar ) {
          matchResult = `${diff} & ${holesRemaining}`;
          isMatchOver = true;
          t.matchOver = true;
          t.win = true;
          winningTeam = t.team;
          h.teams[otherTeamIndex] = {
            ...h.teams[otherTeamIndex],
            matchOver: true,
            matchDiff: matchResult,
          }
          if( holesRemaining > 0 ) {
            t.matchDiff = matchResult;
          } else {
            t.matchDiff = diff;
          }
        } else {
          t.matchDiff = diff;
        }
      });
    }
  });

  return ret;
};

const incrementPlayer = (players, pkey, type, value) => {
  const i = findIndex(players, {pkey: pkey});
  if( i < 0 ) return;
  //console.log('incrementPlayer', pkey, type, value);
  players[i][type] += (parseFloat(value) || 0);
};

const calcPlayerJunk = ({players, pkey, game, hole, allScoringHole, allJunk}) => {

  let tp = 0;
  let pp = 0;
  //console.log('calcPlayerScore beg', gPlayer, hole, tp, pp);

  const round = get_round_for_player(game.rounds, pkey);
  const score = get_score(hole, round);
  const gross = get_score_value('gross', score);
  const net = get_net_score(gross, score);
  const pops = get_pops(score);
  const teeHole = get_hole(hole, round);
  const par = (teeHole && teeHole.par) ? parseFloat(teeHole.par) : 0.0;
  const grossToPar = gross - par;
  const netToPar = net - par;

  // add to players section of scores
  incrementPlayer(players, pkey, 'gross', gross);
  incrementPlayer(players, pkey, 'net', net);
  incrementPlayer(players, pkey, 'grossToPar', grossToPar);
  incrementPlayer(players, pkey, 'netToPar', netToPar);
  if( gross > 0 ) incrementPlayer(players, pkey, 'holesScored', 1);

  // player junk
  const playerJunk = [];
  allJunk.map(gsJunk => {
    if( gsJunk.scope != 'player' ) return;
    let j = false;
    switch ( gsJunk.based_on ) {
      case 'user':
        const jv = getJunk(gsJunk.name, pkey, game, hole);
        if( jv == 'true' || jv == true ) j = true;
        break;
      case 'gross':
      case 'net':
        const s = gsJunk.based_on == 'gross' ? gross : net;
        j = isScoreToParJunk(gsJunk, s, par) ? true : false;
        break;
      default:
        console.log(`scoring - invalid junk based_on
          '${gsJunk.based_on}'`);
        break;
    }
    //console.log('player j', gPlayer, gsJunk, j);
    if( j == true ) {
      if( gsJunk.limit.length == 0 ) pp += gsJunk.value;
      tp += gsJunk.value;
      playerJunk.push(gsJunk);
    }
  });
  //console.log('calcPlayerScore end', gPlayer, hole, tp, pp);

  return ({
    p: {
      pkey: pkey,
      score: {
        gross: { value: gross, toPar: grossToPar},
        net: { value: net, toPar: netToPar},
        pops: { value: pops, toPar: null},
        points: { value: 0, toPar: null},
      },
      junk: playerJunk,
    },
    tp,
    pp,
  });

};

const calcTeamScore = ({team, allJunk}) => {
  let ret = cloneDeep(team);
  allJunk.map(gsJunk => {
    if( gsJunk.scope == 'team' && gsJunk.type == 'dot') {
      switch( gsJunk.calculation ) {
        case 'best_ball':
          const orderedBalls = orderBy(team.players, p => (
            parseFloat(p.score[gsJunk.based_on].value)
          ));
          //console.log('orderedBalls', orderedBalls);
          let val = orderedBalls.map(p => p.score[gsJunk.based_on].value);
          ret.score[gsJunk.name] = val;
          break;
        case 'sum':
          let sum = 0.0;
          team.players.map(player => {
            const newScore = parseFloat(player.score[gsJunk.based_on].value);
            sum = sum + newScore;
          });
          // make value an array because of best_ball calc above needing to be
          // an array that you iterate thru to break ties
          ret.score[gsJunk.name] = [sum];
          break;
        default:
          console.log(`unknown team junk calculation:
            '${gsJunk.calculation}'`);
          break;
      }
    }
  });
  return ret;
};

const calcTeamJunk = ({teams, allJunk, game, scoresEntered}) => {
  const ret = cloneDeep(teams);
  allJunk.map(gsJunk => {
    if( gsJunk.scope == 'team' && gsJunk.type == 'dot' ) {
      // get all team scores array
      const teamScores = teams.map((t, i) => {
        //console.log(`${gsJunk.name} score`, t.score[gsJunk.name]);
        return ({
          team: t.team,
          name: gsJunk.name,
          value: t.score[gsJunk.name],
          index: i,
        });
      });
      //console.log('teamScores', teamScores);

      // figure out how many scores to iterate through to break tie
      // i.e. first ball only, or progress thru the balls for ties
      const maxLenScores = max(teamScores.map(t => t.value.length));
      const ties_option = getOption(game, 'next_ball_breaks_ties');
      const lenOfScores = ( ties_option && ties_option.value === true )
        ? maxLenScores
        : 1;
      //console.log('lenOfScores', lenOfScores);

      let best = teamScores[0];
      let countOfBest = 1;
      let validScores = true;
      for( let i=1; i<teamScores.length; i++ ) {
        for( let j=0; j<lenOfScores; j++ ) {
          //console.log('i', i, 'j', j, teamScores[i].value[j], best.value[j]);
          if( !teamScores[i].value[j] ) {
            //console.log(`we don't have valid scores`);
            validScores = false;
            break;
          }
          if( teamScores[i].value[j] == best.value[j] ) {
            //console.log('adding to countOfBest cuz tied');
            ++countOfBest;
          }
          if( gsJunk.better == 'lower' ) {
            if( teamScores[i].value[j] < best.value[j] ) {
              best = teamScores[i];
              //console.log('this team beat best team', best);
              countOfBest = 1;
              break; // don't go further with these orderedScores
            }
          } else if( gsJunk.better == 'higher' ) {
            if( teamScores[i].value[j] > best.value[j] ) {
              best = teamScores[i];
              //console.log('this team beat best team', best);
              countOfBest = 1;
              break; // don't go further with these orderedScores
            }
          }
        }
      }
      if( validScores &&
          (countOfBest <= lenOfScores) &&
          (game.players.length == scoresEntered)) {
        ret[best.index].junk.push(gsJunk);
        ret[best.index].points = ret[best.index].points + gsJunk.value;
      }
    }
  });
  //console.log('calcTeamJunk ret', ret);
  return ret;
};

export const isScoreToParJunk = (junk, s, par) => {

  // assumes junk.score_to_par is in form '{fit} {amount}' like 'exactly -2'
  const [fit, amount] = junk.score_to_par.split(' ');
  //console.log(junk.name, junk.based_on, s, hole.par, fit, amount);

  switch( fit ) {
    case 'exactly':
      if( (s - par) != parseFloat(amount) ) return null;
      return junk;
      break;
    case 'less_than':
      console.log('less_than');
      break;
    case 'greater_than':
      console.log('greater_than');
      break;
    default:
      // if condition not achieved, return null
      return null;
  }

};

export const format = ({v, type, showDown = true}) => {
  if( type === 'points' && parseFloat(v) == 0 ) return ``;
  if( type === 'points' && parseFloat(v) > 0 ) return `+${v}`;
  if( type === 'match' ) {
    if( v && v.toString().includes('&') ) return v;
    if( parseFloat(v) < 0 ) {
      return ( showDown )
        ? `${-1*v} dn`
        : '';
    }
    if( parseFloat(v) > 0 ) return `${v} up`;
    if( parseFloat(v) == 0 ) return 'AS';
  }
  return v;
};

export const upsertScore = (score, newGross) => {
  const ts = moment.utc().format();

  const newScore = {
    hole: score.hole,
    values: [],
  };
  if( score && score.values && score.values.length ) {
    score.values.map(s => {
      let newVal = s.v;
      let newTS = s.ts;
      if( s.k == 'gross' ) {
        newVal = newGross;
        newTS = ts;
      }
      newScore.values.push({
        k: s.k,
        v: newVal,
        ts: newTS,
      });
    });
  } else {
    newScore.values = [{
      k: 'gross',
      v: newGross,
      ts: ts,
    }]
  }
  //console.log('newScore', newScore);
  return newScore;
};