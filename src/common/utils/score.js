import { getHoles } from 'common/utils/game';

import { find, orderBy } from 'lodash';
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
      let teamTotal = 0;
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
              teamTotal = teamTotal + gsJunk.value;
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
        total: 0,
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

      team.total = teamTotal;

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
              teams[best.index].total = teams[best.index].total + gsJunk.value;
              break;
            }
          } else if( gsJunk.better == 'higher' ) {
            if( sorted[i].value < best.value ) {
              // best is good, break out of this loop
              teams[best.index].junk.push(gsJunk);
              teams[best.index].total = teams[best.index].total + gsJunk.value;
              break;
            }
          }
        }

//        if( hole == '1' ) console.log('teams', sorted[i].index, teams, teams[sorted[i].index]);


      }
    });

    // multipliers

    // team junk that depends on team score or something after the above calcs

    // total

    if( hole == '1' ) console.log('teams', hole, teams);

    ret.holes.push({
      hole: hole,
      teams: teams,
    });

  });

  //console.log('scoring final', ret);

  // TODO: remove me once calcs are done
  //ret = staticScore();

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






const staticScore = () => {

  return {
    holes: [
      {
        hole: '1',
        teams: [
          {
            team: '1',
            players: [
              {
                pkey: '34483698',
                score: [
                  {gross: 3},
                  {net: 3},
                ],
                junk: [
                  {
                    name: 'prox',
                    seq: 3,
                    value: 1,
                  },
                  {
                    name: 'birdie',
                    seq: 4,
                    value: 1,
                  },
                ],
              },
              {
                pkey: '35217104',
                score: [
                  {gross: 4},
                  {net: 4},
                ],
                junk: [],
              },
            ],
            score: [
              {low_ball: 3},
              {low_team: 7},
            ],
            junk: [
              {
                name: 'low_ball',
                value: 2,
                icon: 'album',
                seq: 1,
              },
              {
                name: 'low_team',
                value: 2,
                icon: 'album',
                seq: 2,
              },
            ],
            total: 12,
          },
          {
            team: '2',
            players: [
              {
                pkey: '35216720',
                score: [
                  {gross: 4},
                  {net: 4},
                ],
                junk: [],
              },
              {
                pkey: '35217480',
                score: [
                  {gross: 4},
                  {net: 4},
                ],
                junk: [],
              },
            ],
            score: [
              {low_ball: 4},
              {low_team: 8},
            ],
            junk: [],
            total: 0,
          },
        ],
        multipliers: [
          {
            name: 'bbq',
            value: 2,
            icon: 'album',
            seq: 4,
          },
        ],
      },
    ],
  };

};
