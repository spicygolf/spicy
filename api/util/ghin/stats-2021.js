import { getPlayersScores, login } from '../../src/util/ghin';

import arg from 'arg';
import { format } from 'date-fns';

const getTeam = team => {
  if( team == 'boorad' ) {
    return [
      {name: 'boo', last: 'Anderson', ghin: '1152839'},
      {name: 'russian', last: 'Pederson', ghin: '2386132'},
      {name: 'andeeeee', last: 'Kardian', ghin: '10367793'},
      {name: 'rack', last: 'Rackey', ghin: '10351934'},
      {name: 'daddy koepka', last: 'Noyce', ghin: '2245133'},
      {name: 'bear', last: 'Santone', ghin: '2608952'},
    ];
  }
  if( team == 'merlot' ) {
    return [
      {name: 'marc', last: 'Noland', ghin: '2983539'},
      {name: 'greg', last: 'Hart', ghin: '10365605'},
      {name: 'fin', last: 'Serafin', ghin: '472794'},
      {name: 'karcsh', last: 'Karcsh', ghin: '10302888'},
      {name: 'corey', last: 'Goff', ghin: '10364861'},
      {name: 'carter', last: 'Noland', ghin: '10401592'},
    ];
  }
};


const team_stats = async team => {
  const team_data = getTeam(team);

  const begDate = new Date(2021, 0, 0);
  const endDate = new Date();
  const fmt = 'yyyy-MM-dd';

  team_data.map(async player => {
    const { golfers, token } = await login(player.ghin, player.last);
    let index = null;
    if( golfers && golfers[0] && golfers[0].Value ) index = golfers[0].Value;
    const scores = await getPlayersScores({
      golfer_id: player.ghin,
      offset: 0,
      limit: 300,
      from_date_played: format(begDate, fmt),
      to_date_played: format(endDate, fmt),
      statuses: 'Validated',
      source: 'GHINcom',
    }, token);
    console.log(`${player.name}\t${index}\t${scores.total_count}\t${scores.highest_score}\t${scores.lowest_score}\t${scores.average}`);
  });
};

const args = arg({
  '--team': String,
});


const main = () => {
  //console.log('args', args);
  if( args['--team'] ) team_stats(args['--team']);
};


main();
