
import { find } from 'lodash';



export const get_round_for_player = (rounds, pkey) => {
  const ret = find(rounds, r => r.player[0]._key == pkey);
  //console.log('get_round_for_player', ret);
  return ret;
};
