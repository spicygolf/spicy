import { getHoles } from 'common/utils/game';

import { find, orderBy, reduce, sortBy } from 'lodash';
import {
  get_hole,
  get_net_score,
  get_round_for_player,
  get_score,
  get_score_value,
} from './rounds';



export const scoring = (game, gamespec) => {

  const { _key: gkey } = game;

  let ret = {
    holes: [],
  };

  const holes = getHoles(game);
  holes.map(hole => {
    //console.log('scoring hole', hole);
    const gHole = find(game.teams.holes, {hole: hole});

    const teams = gHole.teams.map(gTeam => {
      let teamPoints = 0;
      let team = {
        team: gTeam.team,
        players: gTeam.players.map(gPlayer => {

          // player score
          const round = get_round_for_player(game.rounds, gPlayer);
          const score = get_score(hole, round);
          const gross = get_score_value('gross', score);
          const net = get_net_score(gross, score, gkey);
          const teeHole = get_hole(hole, round);
          const par = (teeHole && teeHole.par) ? parseFloat(teeHole.par) : 0.0;

          // player junk
          const playerJunk = [];
          gamespec.junk.map(gsJunk => {
            if( gsJunk.scope != 'player' ) return;
            let j = false;
            switch ( gsJunk.based_on ) {
              case 'user':
                //console.log('gsv', gsJunk.name, score, get_score_value(gsJunk.name, score));
                j = get_score_value(gsJunk.name, score) == 'true';
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
              teamPoints = teamPoints + gsJunk.value;
              playerJunk.push(gsJunk);
            }
          });

          return ({
            pkey: gPlayer,
            score: {gross: gross, net: net},
            junk: playerJunk,
          });
        }),
        score: [],
        junk: [],
        points: 0,
        holeTotal: 0,
        runningTotal: 0,
        gameTotal: 0,
      };

      // team score
      gamespec.junk.map(gsJunk => {
        if( gsJunk.scope == 'team' && gsJunk.type == 'dot') {
          //if( hole == '1' ) console.log('team score gsJunk', gsJunk);
          switch( gsJunk.calculation ) {
            case 'best_ball':
              let bb = null;
              team.players.map(player => {
                const newScore = parseFloat(player.score[gsJunk.based_on]);
                if( !bb ) {
                  bb = newScore;
                } else {
                  bb = (newScore < bb) ? newScore: bb;
                }
              });
              team.score[gsJunk.name] = bb;
              break;
            case 'sum':
              let sum = 0.0;
              team.players.map(player => {
                const newScore = parseFloat(player.score[gsJunk.based_on]);
                sum = sum + newScore;
              });
              team.score[gsJunk.name] = sum;
              break;
            default:
              console.log(`unknown team junk calculation:
                '${gsJunk.calculation}'`);
              break;
          }
        }

      });

      team.points = teamPoints;

      return team;
    });

    // team junk
    gamespec.junk.map(gsJunk => {
      if( gsJunk.scope == 'team' && gsJunk.type == 'dot' ) {

        const teamScores = teams.map((t, i) => ({
          team: t.team,
          name: gsJunk.name,
          value: t.score[gsJunk.name],
          index: i,
        }));
        const direction = (gsJunk.better == 'lower') ? 'asc' : 'desc';
        const sorted = orderBy(teamScores, ['value'], [direction]);

        let best = sorted[0];
        for( let i=1; i<sorted.length; i++ ) {
          if( gsJunk.better == 'lower' ) {
            if( sorted[i].value > best.value ) {
              // best is good, break out of this loop
              teams[best.index].junk.push(gsJunk);
              teams[best.index].points = teams[best.index].points + gsJunk.value;
              break;
            }
          } else if( gsJunk.better == 'higher' ) {
            if( sorted[i].value < best.value ) {
              // best is good, break out of this loop
              teams[best.index].junk.push(gsJunk);
              teams[best.index].points = teams[best.index].points + gsJunk.value;
              break;
            }
          }
        }

//        if( hole == '1' ) console.log('teams', sorted[i].index, teams, teams[sorted[i].index]);

      }
    });

    // team junk that depends on team score or something after the above calcs
    //   something like 'ky' or 'oj' in wolfhammer

    // multipliers
    const multipliers = [];
    gamespec.multipliers.map(gsMult => {
      if( gsMult.based_on == 'user' ) {
        if( hole == '2' ) console.log('scoring mult', gsMult, gHole);
        if( gHole && gHole.multipliers && gHole.multipliers.includes(gsMult.name) ) {
          multipliers.push(gsMult);
        }
      } else {
        //if( hole == '1' ) console.log('non-user multiplier', gsMult);
        // loop thru teams and players to see if this multiplier is achieved
        teams.map(t => {
          t.players.map(p => {
            const j = find(p.junk, {name: gsMult.based_on});
            if( j ) {
              switch( gsMult.availability ) {
                case 'got_all_points':
                  // did this team get all the points?  if not, exit out
                  let other_teams_points = 0;
                  teams.map(getall_team => {
                    if( getall_team.team != t.team ) {
                      other_teams_points += getall_team.points;
                    }
                  });
                  if( other_teams_points == 0 ) {
                    multipliers.push(gsMult);
                  }
                  break;
                default:
                  break;
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
      t.holeTotal = t.points * holeMultiplier;
    });

    //  if( hole == '1' ) console.log(hole, teams, multipliers);

    ret.holes.push({
      hole: hole,
      teams: teams,
      multipliers: multipliers,
      holeMultiplier: holeMultiplier,
    });

  });

  // runningTotal calcs

  const teamTotals = [];

  // loop thru holes, calculating runningTotal for each team
  // TODO: do we need to go by seq or other order?
  ret.holes.map((h, i) => {

    h.teams.map(t => {
/*
      let teamTotalsIndex = findIndex(teamTotals, {team: t.team});
      if( teamTotalsIndex < 0 ) {
        // we didn't find a teamTotals object for this team, so make one
        // with defaults of zero
        teamTotalsIndex = 0;
        teamTotals.push({
          team: t.team,
          runningTotal: 0,
        });
      }
*/
      let lastHoleRunningTotal = ( i == 0 ) ? 0
        : find(ret.holes[i-1].teams, {team: t.team}).runningTotal;
      //console.log('lastHoleRunningTotal', lastHoleRunningTotal, 't', t);

      t.runningTotal = lastHoleRunningTotal + t.holeTotal;
      //console.log('teamTotals', h.hole, t.runningTotal);
    });
  });


  console.log('scoring final', ret);

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

export const isTeamDownTheMost = (hole, team) => {
  if( !hole ) return true;

  const teamScores = hole.teams.map(t => ({
    team: t.team,
    score: t.runningTotal
  }));
  const sortedTeamScores = sortBy(teamScores, ['score'], ['asc']);
  const teamsDownTheMost = [sortedTeamScores[0].team];
  const lowestScore = sortedTeamScores[0].score;
  for( let i=1; i < sortedTeamScores.length; i++ ) {
    if( sortedTeamScores[i].score == lowestScore ) {
      teamsDownTheMost.push(sortedTeamScores[i].team);
    } else {
      break;
    }
  }
  //console.log('isTeamDownTheMost', sortedTeamScores, teamsDownTheMost);
  return teamsDownTheMost.includes(team.team);

};