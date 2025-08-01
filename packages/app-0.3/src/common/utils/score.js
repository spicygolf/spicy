import {
  getAllOptions,
  getGamespecKVs,
  getHoles,
  getJunk,
  getOptionValue,
  isOptionOnThisHole,
} from 'common/utils/game';
import {
  get_hole,
  get_net_score,
  get_pops,
  get_round_for_player,
  get_score,
  get_score_value,
} from 'common/utils/rounds';
import ScoringWrapper from 'common/utils/ScoringWrapper';
import { cloneDeep, concat, filter, find, findIndex, max, orderBy } from 'lodash';
import moment from 'moment';

export const getScoringFromGamespecs = (game) => {
  let ret = {};
  game.gamespecs.map((gs) => {
    const { scoring } = gs;
    if (!scoring) {
      return;
    }

    for (const [scoringType, s] of Object.entries(scoring)) {
      if (!ret[scoringType]) {
        ret[scoringType] = [];
      }
      ret[scoringType] = concat(ret[scoringType], s);
    }
  });
  delete ret.__typename;
  //console.log('allScoring', ret);
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
export const scoring = (game) => {
  const allScoring = getScoringFromGamespecs(game);
  const allJunk = getAllOptions({ game, type: 'junk' });
  const allMultipliers = getAllOptions({ game, type: 'multiplier' });
  const pointsGame = getGamespecKVs(game, 'type').includes('points');
  const matchplayGame = getGamespecKVs(game, 'type').includes('match');
  const betterPoints = getGamespecKVs(game, 'better');

  // player scoring
  let players = game.players.map((p) => {
    if (!p) {
      return;
    }
    const round = get_round_for_player(game.rounds, p._key);
    const ch = round?.course_handicap ? parseFloat(round.course_handicap) : 0;
    return {
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
    };
  });

  // return value of main scoring function
  let ret = {
    holes: [],
    players,
  };

  const holes = getHoles(game);
  holes.map((hole) => {
    //console.log(`scoring hole '${hole}'   ***********************************`);

    const gHole = find(game.holes, { hole });
    //console.log('gHole', gHole);
    if (!gHole) {
      return;
    }

    let teams = [];
    let scoresEntered = 0;

    // begin possiblePoints calcs
    let possiblePoints = 0;
    allJunk.map((gsJunk) => {
      if (!isOptionOnThisHole({ option: gsJunk, hole })) {
        return;
      }
      if (gsJunk.limit === 'one_team_per_group' || gsJunk.limit === 'one_per_group') {
        const jo = getOptionValue({ option: gsJunk, hole });
        possiblePoints += jo.value;
        // console.log(
        //   'adding to possible points',
        //   hole,
        //   gsJunk.name,
        //   jo.value,
        //   possiblePoints,
        // );
      }
    });

    teams = gHole.teams.map((gTeam) => {
      let teamPoints = 0;
      let team = {
        team: gTeam.team,
        players: gTeam.players.map((gPlayer) => {
          const pkey = gPlayer;
          const { p, tp, pp } = calcPlayerJunk({ players, pkey, game, hole, allJunk });
          teamPoints += tp;
          possiblePoints += pp;
          if (p && p.score && p.score.gross && p.score.gross.value) {
            ++scoresEntered;
          }
          return p;
        }),
        score: [],
        junk: [],
        points: teamPoints,
        holeTotal: 0,
        runningTotal: 0,
        runningDiff: 0,
        matchDiff: 0,
        matchOver: false,
      };
      //console.log('team', team);
      return team;
    });

    teams = calcTeamScore({
      teams,
      allScoring,
      allJunk,
      game,
      scoresEntered,
      hole,
    });

    const { newTeams, pp } = calcTeamJunk({
      teams,
      allScoring,
      allJunk,
      game,
      scoresEntered,
      betterPoints,
      hole,
    });
    teams = newTeams;
    possiblePoints += pp;

    //  junk that depends on team score or something after the above calcs
    //  something like 'ky' or 'oj' in wolfhammer
    const oneHoleScoring = {
      holes: [
        {
          hole: hole,
          teams: teams,
        },
      ],
    };
    const scoringWrapper = new ScoringWrapper(game, oneHoleScoring, hole);

    // multipliers
    const multipliers = [];
    // console.log('allMultipliers', allMultipliers);
    allMultipliers.map((gsMult) => {
      if (!isOptionOnThisHole({ option: gsMult, hole })) {
        return;
      }
      if (gsMult.based_on === 'user') {
        if (gHole && gHole.multipliers) {
          //console.log('scoring gHole', gHole);
          filter(gHole.multipliers, { name: gsMult.name }).map((mult) => {
            multipliers.push({
              ...gsMult,
              team: mult.team,
            });
          });
        }
      } else {
        // loop thru teams and players to see if this multiplier is achieved
        teams.map((t) => {
          t.players.map((p) => {
            const j = find(p.junk, { name: gsMult.based_on });
            if (j) {
              try {
                const logic = scoringWrapper.logic(gsMult.availability, {
                  team: t,
                  possiblePoints: possiblePoints,
                });
                //console.log(hole, j.name, logic, t);
                if (logic) {
                  multipliers.push({
                    ...gsMult,
                    team: t.team,
                  });
                }
              } catch (e) {
                console.log('logic error', e);
              }
            }
          });
        });
      }
    });

    // multipliers
    let holeMultiplier = 1;
    for (let i = 0; i < multipliers.length; i++) {
      const m = multipliers[i];
      const mv = getOptionValue({ option: m, hole });
      if (m.name === 'custom' && !mv?.value) {
        const gMult = find(gHole?.multipliers, { name: 'custom' });
        mv.value = gMult?.value;
        console.log('custom value', mv);
      }
      if (m?.override === true) {
        // this multiplier overrides all others, so only use its value and exit loop
        holeMultiplier = mv.value;
        break;
      }
      holeMultiplier *= mv.value;
    }
    // console.log('holeMultiplier', hole, holeMultiplier);

    // hole totals
    teams.map((t) => {
      const holeTotal = t.points * holeMultiplier;
      t.holeTotal = holeTotal;
      // give points to players on this team
      t.players.map((p) => {
        p.score.points.value = holeTotal;
        incrementPlayer(players, p.pkey, 'points', holeTotal);
      });
    });
    if (teams.length === 2) {
      // calculate net total points
      teams.map((t) => {
        const otherTeamIndex = t.team === '1' ? 1 : 0;
        let holeNetTotal = t.holeTotal - teams[otherTeamIndex].holeTotal;
        if (betterPoints.includes('lower')) {
          holeNetTotal = teams[otherTeamIndex].holeTotal - t.holeTotal;
          //console.log('lower points is better', t.team, holeNetTotal);
        }
        t.holeNetTotal = holeNetTotal;
        // give points to players on this team
        t.players.map((p) => {
          p.score.points.value = t.holeNetTotal; // overwrite holeTotal points in 2-team
          incrementPlayer(players, p.pkey, 'netPoints', t.holeNetTotal);
        });
      });
    }

    // warnings
    let warnings = [];
    let markedJunk = 0,
      requiredJunk = 0;
    allJunk.map((junk) => {
      if (junk.scope === 'player' && junk.limit === 'one_per_group') {
        ++requiredJunk;
        teams.map((t) => {
          t.players.map((p) => {
            if (find(p.junk, { name: junk.name })) {
              ++markedJunk;
            }
          });
        });
      }
    });
    if (markedJunk < requiredJunk && game.players.length === scoresEntered) {
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
    if (h.scoresEntered < game.players.length) {
      allHolesScoredSoFar = false;
    }

    // runningTotal
    h.teams.map((t) => {
      let lastHoleRunningTotal = 0;
      if (i > 0) {
        let lastHole = find(ret.holes[i - 1].teams, { team: t.team });
        lastHoleRunningTotal =
          lastHole && lastHole.runningTotal ? lastHole.runningTotal : 0;
      }
      //console.log('lastHoleRunningTotal', lastHoleRunningTotal, 't', t);
      t.runningTotal =
        game.players.length === h.scoresEntered
          ? lastHoleRunningTotal + t.holeTotal
          : lastHoleRunningTotal;
      //console.log('teamTotals', h.hole, t.runningTotal);
    });

    // match
    if (h.teams.length === 2) {
      h.teams.map((t) => {
        if (matchplayGame && isMatchOver) {
          t.matchDiff = matchResult;
          t.matchOver = true;
          if (t.team === winningTeam) {
            t.win = true;
          }
          return;
        }
        const otherTeamIndex = t.team === '1' ? 1 : 0;
        const diff = t.runningTotal - h.teams[otherTeamIndex].runningTotal;

        if (pointsGame) {
          t.runningDiff = diff;
          if (betterPoints.includes('lower')) {
            t.runningDiff *= -1;
          }
        }

        const holesRemaining = ret.holes.length - i - 1;
        if (matchplayGame && diff > holesRemaining && allHolesScoredSoFar) {
          matchResult = `${diff} & ${holesRemaining}`;
          isMatchOver = true;
          t.matchOver = true;
          t.win = true;
          winningTeam = t.team;
          h.teams[otherTeamIndex] = {
            ...h.teams[otherTeamIndex],
            matchOver: true,
            matchDiff: matchResult,
          };
          if (holesRemaining > 0) {
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
  const i = findIndex(players, { pkey: pkey });
  if (i < 0) {
    return;
  }
  //console.log('incrementPlayer', pkey, type, value);
  players[i][type] += parseFloat(value) || 0;
};

const calcPlayerJunk = ({ players, pkey, game, hole, allScoring, allJunk }) => {
  let tp = 0; // team points
  let pp = 0; // possible points
  // if( hole == '1' ) console.log('calcPlayerScore beg', hole, tp, pp);

  const round = get_round_for_player(game.rounds, pkey);
  const score = get_score(hole, round);
  const gross = get_score_value('gross', score);
  const net = get_net_score(gross, score);
  const pops = get_pops(score);
  const teeHole = get_hole(hole, round);
  const par = teeHole && teeHole.par ? parseFloat(teeHole.par) : 0.0;
  const grossToPar = gross && gross > 0 ? gross - par : 0;
  const netToPar = net - par;

  // add to players section of scores
  incrementPlayer(players, pkey, 'gross', gross);
  incrementPlayer(players, pkey, 'net', net);
  incrementPlayer(players, pkey, 'grossToPar', grossToPar);
  incrementPlayer(players, pkey, 'netToPar', netToPar);
  if (gross > 0) {
    incrementPlayer(players, pkey, 'holesScored', 1);
  }

  // player junk
  const playerJunk = [];
  allJunk.map((gsJunk) => {
    if (!isOptionOnThisHole({ option: gsJunk, hole })) {
      return;
    }
    // console.log('calcPlayerJunk', gsJunk);
    if (gsJunk.scope !== 'player') {
      return;
    }
    let j = false;
    switch (gsJunk.based_on) {
      case 'user':
        const jv = getJunk(gsJunk.name, pkey, game, hole);
        // console.log('jv', jv);
        if (jv === 'true' || jv === true) {
          j = true;
        }
        break;
      case 'gross':
      case 'net':
        const s = gsJunk.based_on === 'gross' ? gross : net;
        j = isScoreToParJunk(gsJunk, s, par) ? true : false;
        break;
      default:
        console.log(`scoring - invalid junk based_on
          '${gsJunk.based_on}'`);
        break;
    }
    if (j === true) {
      const jo = getOptionValue({ option: gsJunk, hole });
      // console.log('calcPlayerJunk j', hole, pkey, gsJunk, jo, pp);
      if (gsJunk.limit.length === 0) {
        pp += jo.value;
      }
      tp += jo.value;
      playerJunk.push(gsJunk);
    }
  });
  // if (hole === '1') {
  //   console.log('calcPlayerScore end', hole, pkey, tp, pp);
  // }

  return {
    p: {
      pkey: pkey,
      score: {
        gross: { value: gross, toPar: grossToPar },
        net: { value: net, toPar: netToPar },
        pops: { value: pops, toPar: null },
        points: { value: 0, toPar: null },
      },
      junk: playerJunk,
    },
    tp,
    pp,
  };
};

const calcTeamScore = ({ teams, allScoring, allJunk, game, scoresEntered, hole }) => {
  // ready to calc yet?  check if all scores are in
  //console.log('calcTeamScore', game.players, scoresEntered, teams);
  if (game.players.length !== scoresEntered) {
    return teams;
  }

  return teams.map((team) => {
    let ret = cloneDeep(team);

    // go thru scoring for team score
    for (const [scoringType, lScoring] of Object.entries(allScoring)) {
      if (!lScoring) {
        continue;
      }
      lScoring.map((s) => {
        if (s.scope === 'team') {
          if (scoringType === 'hole' && s.type === 'vegas') {
            ret = vegasTeamScore({ team: ret, teams, game, hole, s });
          }
        }
      });
    }

    // go thru junk for team score
    allJunk.map((gsJunk) => {
      if (!isOptionOnThisHole({ option: gsJunk, hole })) {
        return;
      }
      if (gsJunk.scope === 'team') {
        if (gsJunk.sub_type === 'dot') {
          switch (gsJunk.calculation) {
            // TODO: convert low_ball and low_team over to logic, and get rid of
            //       gsJunk.calculation and best_ball and sum cases below.
            //       i.e. only use gsJunk.logic field going forward
            case 'logic':
              const oneHoleScoring = {
                holes: [
                  {
                    hole: hole,
                    teams: teams,
                  },
                ],
              };
              const scoringWrapper = new ScoringWrapper(game, oneHoleScoring, hole);
              let junk_pts = 0;
              try {
                const logic = scoringWrapper.logic(gsJunk.logic, {
                  team,
                  teams,
                  junk: gsJunk,
                });
                //console.log('team junk logic', hole, logic);
                if (logic) {
                  const jo = getOptionValue({ game, hole, option: gsJunk });
                  // console.log('jo', jo);
                  junk_pts = jo.value;
                }
              } catch (e) {
                console.log('logic error', e);
              }
              ret.score[gsJunk.name] = junk_pts;
              break;
            // TODO: see above, only use 'logic' in future
            case 'best_ball':
              const orderedBalls = orderBy(team.players, (p) =>
                parseFloat(p.score[gsJunk.based_on].value),
              );
              //console.log('orderedBalls', orderedBalls);
              let val = orderedBalls.map((p) =>
                parseFloat(p.score[gsJunk.based_on].value),
              );
              ret.score[gsJunk.name] = val;
              break;
            // TODO: see above, only use 'logic' in future
            case 'sum':
              let sum = 0.0;
              team.players.map((player) => {
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
        } else {
          console.log('unknown junk type: ', gsJunk.sub_type);
        }
      }
    });
    // console.log('calcTeamScore', ret);
    return ret;
  });
};

const calcTeamJunk = ({
  teams,
  allScoring,
  allJunk,
  game,
  scoresEntered,
  betterPoints,
  hole,
}) => {
  // ready to calc yet?  check if all scores are in for this hole
  //console.log('calcTeamJunk', game.players, scoresEntered, teams);
  if (game.players.length !== scoresEntered) {
    return {
      newTeams: teams,
      pp: 0,
    };
  }

  let ret = cloneDeep(teams);
  let maxJunkPoints = 0;

  allJunk.map((gsJunk) => {
    if (!isOptionOnThisHole({ option: gsJunk, hole })) {
      return;
    }
    if (gsJunk.scope === 'team') {
      if (gsJunk.sub_type === 'dot') {
        // get all team scores array
        const teamScores = teams.map((t, i) => {
          // console.log(`${gsJunk.name} score`, t.score[gsJunk.name]);
          return {
            team: t.team,
            name: gsJunk.name,
            value: t.score[gsJunk.name],
            index: i,
          };
        });
        // console.log('teamScores', teamScores);

        switch (gsJunk.calculation) {
          case 'logic':
            // logic already has points calculated, so just use them
            const betterMult = betterPoints === 'lower' ? -1 : 1;
            for (let i = 0; i < teamScores.length; i++) {
              if (teamScores[i].value !== 0 && game.players.length === scoresEntered) {
                ret[i].junk.push(gsJunk);
                ret[i].points = ret[i].points + teamScores[i].value * betterMult;
                // of the junk that has points, add the max # of these junk to possiblePoints
                // TODO: this works for 9/10 Points game (3,3,3 or 5,3,1, etc),
                //       but does it work universally?  Other junk?
                maxJunkPoints = Math.max(teamScores[i].value, maxJunkPoints);
              }
            }
            break;
          default:
            // TODO: replace low_ball and low_total with logic (like above)
            //       and move these bits into ScoringWrapper under custom fns

            // figure out how many scores to iterate through to break tie
            // i.e. first ball only, or progress thru the balls for ties
            const maxLenScores = max(teamScores.map((t) => t.value.length));
            const ties_option = getOptionValue({
              game,
              hole,
              option: 'next_ball_breaks_ties',
            });
            const lenOfScores =
              ties_option && ties_option.value === true ? maxLenScores : 1;
            //console.log('lenOfScores', lenOfScores);

            let best = teamScores[0];
            let countOfBest = 1;
            let validScores = true;
            for (let i = 1; i < teamScores.length; i++) {
              for (let j = 0; j < lenOfScores; j++) {
                //console.log('i', i, 'j', j, teamScores[i].value[j], best.value[j]);
                if (!teamScores[i].value[j]) {
                  //console.log(`we don't have valid scores`);
                  validScores = false;
                  break;
                }
                if (teamScores[i].value[j] === best.value[j]) {
                  //console.log('adding to countOfBest cuz tied');
                  ++countOfBest;
                }
                if (gsJunk.better === 'lower') {
                  if (teamScores[i].value[j] < best.value[j]) {
                    best = teamScores[i];
                    //console.log('this team beat best team', best);
                    countOfBest = 1;
                    break; // don't go further with these orderedScores
                  }
                } else if (gsJunk.better === 'higher') {
                  if (teamScores[i].value[j] > best.value[j]) {
                    best = teamScores[i];
                    //console.log('this team beat best team', best);
                    countOfBest = 1;
                    break; // don't go further with these orderedScores
                  }
                }
              }
            }
            // console.log(
            //   'after team junk',
            //   validScores,
            //   best,
            //   countOfBest,
            //   lenOfScores,
            //   game.players.length,
            //   scoresEntered,
            // );
            if (
              validScores &&
              best &&
              countOfBest <= lenOfScores &&
              game.players.length === scoresEntered
            ) {
              ret[best.index].junk.push(gsJunk);
              const jo = getOptionValue({ game, hole, option: gsJunk });
              ret[best.index].points = ret[best.index].points + jo.value;
            }
            break;
        }
      } else {
        console.log('unknown junk type: ', gsJunk.sub_type);
      }
    }
  });
  // console.log('calcTeamJunk', ret, maxJunkPoints);
  return {
    newTeams: ret,
    pp: maxJunkPoints,
  };
};

export const isScoreToParJunk = (junk, s, par) => {
  // assumes junk.score_to_par is in form '{fit} {amount}' like 'exactly -2'
  if (!junk.score_to_par) {
    return null;
  }
  const [fit, amount] = junk.score_to_par.split(' ');
  //console.log(junk.name, junk.based_on, s, hole.par, fit, amount);

  let ret;
  switch (fit) {
    case 'exactly':
      if (s - par !== parseFloat(amount)) {
        return null;
      }
      ret = junk;
      break;
    case 'less_than':
      console.log('less_than');
      break;
    case 'greater_than':
      console.log('greater_than');
      break;
    default:
      // if condition not achieved, return null
      ret = null;
  }
  return ret;
};

export const format = ({ v, type, showDown = true }) => {
  // round v to two decimals if v is not an integer
  if (v && v !== 0.0 && !Number.isInteger(v)) {
    v = Math.round((v + Number.EPSILON) * 100) / 100;
  }

  // logic
  if (type === 'points' && parseFloat(v) === 0) {
    return v;
  }
  if (type === 'points' && parseFloat(v) > 0) {
    return `+${v}`;
  }
  if (type === 'match') {
    if (v && v.toString().includes('&')) {
      return v;
    }
    if (parseFloat(v) < 0) {
      return showDown ? `${-1 * v} dn` : '';
    }
    if (parseFloat(v) > 0) {
      return `${v} up`;
    }
    if (parseFloat(v) === 0) {
      return 'tied';
    }
  }
  return v;
};

export const upsertScore = (score, newGross) => {
  const ts = moment.utc().format();

  const newScore = {
    __typename: 'Score',
    hole: score.hole,
    values: [],
  };
  if (score && score.values && score.values.length) {
    score.values.map((s) => {
      let newVal = s.v;
      let newTS = s.ts;
      if (s.k === 'gross') {
        newVal = newGross;
        newTS = ts;
      }
      newScore.values.push({
        __typename: 'Value',
        k: s.k,
        v: newVal,
        ts: newTS,
      });
    });
  } else {
    newScore.values = [
      {
        __typename: 'Value',
        k: 'gross',
        v: newGross,
        ts: ts,
      },
    ];
  }
  //console.log('newScore', newScore);
  return newScore;
};

export const vegasTeamScore = ({ team, teams, game, hole, s }) => {
  //console.log('s', s);
  //console.log('team', team);
  const teamDigits = team.players
    .map((p) => parseFloat(p.score[s.based_on].value))
    .sort();

  const otherTeamIndex = team.team === '1' ? 1 : 0;
  const otherTeam = teams[otherTeamIndex];

  // flips digits?  add10?
  let flip = false;
  //let addPoints = 0;

  let thisTeamJunk = [];
  team.players.map((p) => {
    thisTeamJunk = concat(thisTeamJunk, p.junk);
  });
  let otherTeamJunk = [];
  otherTeam.players.map((p) => {
    otherTeamJunk = concat(otherTeamJunk, p.junk);
  });
  const thisTeamBirdies = countJunk(thisTeamJunk, { name: 'birdie' });
  const thisTeamEagles = countJunk(thisTeamJunk, { name: 'eagle' });
  const otherTeamBirdies = countJunk(otherTeamJunk, { name: 'birdie' });
  const otherTeamEagles = countJunk(otherTeamJunk, { name: 'eagle' });
  const birdies_cancel_option = getOptionValue({
    game,
    hole,
    option: 'birdies_cancel_flip',
  });

  if (otherTeamBirdies) {
    if (!birdies_cancel_option || !(thisTeamBirdies || thisTeamEagles)) {
      flip = true;
    }
  }
  if (otherTeamEagles) {
    if (!birdies_cancel_option || !thisTeamEagles) {
      flip = true;
    }
  }

  // now perform math on digits and team object
  if (flip) {
    teamDigits.sort((a, b) => b - a);
  }
  let points = teamDigits[0] * 10 + teamDigits[1];
  team.points += points;

  //console.log('scoring vegas  this team', team);
  return team;
};

const countJunk = (junk, fltr) => {
  const f = filter(junk, fltr);
  if (!f) {
    return 0;
  }
  //console.log('f', f);
  return f.length;
};
