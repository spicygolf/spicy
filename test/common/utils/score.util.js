import { findIndex } from 'lodash';

export const makeGame = ({ gamespecs = [], options = [], holes = [], data = [] }) => {
  let players = [];
  let rounds = [];
  let holeteams = {};
  data.map((d) => {
    const newPlayer = { _key: `p_${d.player}` };
    const dhole = d && d.hole ? `${d.hole}` : '1';
    const playerIndex = findIndex(players, newPlayer);
    if (playerIndex < 0) {
      players.push(newPlayer);
    }
    const roundIndex = findIndex(rounds, { _key: `r_${d.player}` });
    if (roundIndex < 0) {
      const newRound = {
        _key: `r_${d.player}`,
        player: [newPlayer],
        scores: [
          { hole: dhole, values: [{ k: 'gross', v: `${d.score}` }], pops: `${d.pops}` },
        ],
        tee: {
          holes: holes.map((hole) => ({ hole: `${hole.hole}`, par: `${hole.par}` })),
        },
      };
      rounds.push(newRound);
    } else {
      rounds[roundIndex].scores.push({
        hole: dhole,
        values: [{ k: 'gross', v: `${d.score}` }],
        pops: `${d.pops}`,
      });
    }
    if (!holeteams[dhole]) {
      holeteams[dhole] = [];
    }
    let teamIndex = findIndex(holeteams[dhole], { team: `${d.team}` });
    if (teamIndex < 0) {
      holeteams[dhole].push({ team: `${d.team}`, players: [], junk: [] });
      teamIndex = holeteams[dhole].length - 1;
    }
    holeteams[dhole][teamIndex].players.push(`p_${d.player}`);
    d.junk.map((j) => {
      holeteams[dhole][teamIndex].junk.push({
        ...j,
        player: `p_${d.player}`,
        value: 'true',
      });
    });
  });
  // console.log('holeteams', JSON.stringify(holeteams, null, 2));

  return {
    gamespecs,
    options,
    holes: holes.map((h) => ({
      hole: `${h.hole}`,
      multipliers: h.multipliers,
      teams: holeteams[`${h.hole}`].map((t) => ({
        team: t.team,
        players: t.players,
        junk: t.junk,
      })),
    })),
    players,
    rounds,
  };
};
