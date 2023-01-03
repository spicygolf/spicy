import { getPlayers, getPlayersScores, login } from '../../src/util/ghin';

const getTeam = (team) => {
  if (team == 'carter') {
    return [
      { name: 'boo', last: 'Anderson', ghin: '1152839' },
      { name: 'russian', last: 'Pederson', ghin: '2386132' },
      { name: 'marc', last: 'Noland', ghin: '2983539' },
      { name: 'karcsh', last: 'Karcsh', ghin: '10302888' },
      { name: 'corey', last: 'Goff', ghin: '10364861' },
      { name: 'carter', last: 'Noland', ghin: '10401592' },
    ];
  }
  if (team == 'serafin') {
    return [
      { name: 'greg', last: 'Hart', ghin: '10365605' },
      { name: 'fin', last: 'Serafin', ghin: '472794' },
      { name: 'andeeeee', last: 'Kardian', ghin: '10367793' },
      { name: 'rack', last: 'Rackey', ghin: '10351934' },
      { name: 'daddy koepka', last: 'Noyce', ghin: '2245133' },
      { name: 'bear', last: 'Santone', ghin: '2608952' },
    ];
  }
};

const team_stats = async ({ team, token }) => {
  const team_data = getTeam(team);

  return team_data.map(async (player) => {
    let index = null;
    const { golfers } = await getPlayers({
      qs: {
        status: 'Active',
        golfer_id: player.ghin,
        page: 1,
        perPage: 25,
        from_ghin: true,
        source: 'GHINcom',
      },
      token,
    });
    const golfer = golfers[0];
    const { score_history_stats: scores } = await getPlayersScores({
      ghin: player.ghin,
      token,
    });
    const ret = `${player.name}\t${golfer.handicap_index}\t${scores.total_count}\t${scores.highest_score}\t${scores.lowest_score}\t${scores.average}`;
    console.log(ret);
    return ret;
  });
};

const main = async () => {
  const { token } = await login('1152839', 'Anderson');
  // return;

  const carter = await team_stats({ team: 'carter', token });
  const serafin = await team_stats({ team: 'serafin', token });

  console.log(carter);
  console.log(serafin);
};

main();
