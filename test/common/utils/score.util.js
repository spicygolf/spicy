import { findIndex } from 'lodash';


export const makeGame = ({
  gamespecs = [],
  options = [],
  hole = {},
  players_teams = [],
}) => {

  let players = [];
  let rounds = [];
  let teams = [];
  players_teams.map(pt => {
    const newPlayer = {_key: `p_${pt.player}`};
    players.push(newPlayer);
    rounds.push({
      _key: `r_${pt.player}`,
      player: [newPlayer],
      scores: [
        {hole: `${hole.hole}`, values: [{k: 'gross', v: `${pt.score}`}], pops: `${pt.pops}`},
      ],
      tee: {
        holes: [
          {hole: `${hole.hole}`, par: `${hole.par}`},
        ],
      },
    });
    let teamIndex = findIndex(teams, {team: `${pt.team}`});
    if( teamIndex < 0 ) {
      const newLen = teams.push({team: `${pt.team}`, players: [], junk: []});
      teamIndex = newLen - 1;
    }
    teams[teamIndex].players.push(`p_${pt.player}`);
    pt.junk.map(j => {
      teams[teamIndex].junk.push({...j, player: `p_${pt.player}`, value: "true"});
    });
  });
  //console.log('teams', JSON.stringify(teams, null, 2));
  let holes = [
    {
      hole: `${hole.hole}`,
      teams,
      multipliers: hole.multipliers,
    },
  ];

  return {
    gamespecs,
    options,
    holes: holes.map(h => ({
      hole: h.hole,
      multipliers: h.multipliers,
      teams: h.teams.map(t => ({
        team: t.team,
        players: t.players,
        junk: t.junk,
      })),
    })),
    players,
    rounds,
  };
};
