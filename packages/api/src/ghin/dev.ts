import { getTee } from './getTee';
import { searchPlayer } from './searchPlayer';

const main = async () => {

  // search for a player
  const searchPlayerResp = await searchPlayer({
    q: {
      last_name: 'einhorn%',
      first_name: '',
      country: 'US',
      state: 'WI',
      // status: 'Active',
      sorting_criteria: 'last_name_first_name',
      order: 'ASC'
    },
    p: {
      page: 1,
      per_page: 50,
    }
  });
  console.log('searchPlayer', searchPlayerResp);

  // get a tee set
  const getTeeResp = await getTee({
    q: {
      tee_id: '456824',
    }
  });
  console.log('getTee', getTeeResp);


};

main();
