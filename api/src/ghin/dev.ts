import { search_player } from './search_player';
import { login } from './login';

const { GHIN_EMAIL, GHIN_PASS } = process.env;

const main = async () => {

  // login & get token
  const token = await login({
    email: GHIN_EMAIL,
    password: GHIN_PASS,
    remember_me: true
  });

  // search for a player
  const search_player_resp = await search_player({
    token,
    q: {
      last_name: 'anderson%',
      first_name: 'b%',
      country: 'US',
      state: 'GA',
      status: 'Active',
      sorting_criteria: 'last_name_first_name',
      order: 'ASC'
    },
    p: {
      page: 1,
      per_page: 50,
    }
  });
  console.log('search_player', search_player_resp);


};

main();
