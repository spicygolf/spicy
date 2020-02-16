
import { find } from 'lodash';



export const get_round_for_player = (rounds, pkey) => {
  const ret = find(rounds, r => r.player[0]._key == pkey);
  //console.log('get_round_for_player', ret);
  return ret;
};


export const get_hole = (hole, round) => {
  if( round && round.tee && round.tee.holes ) {
    const ret = find(round.tee.holes, h => h.hole == hole);
    //console.log('hole', hole);
    return ret;
  } else {
    return null;
  }
};

// hole int, round {}
export const get_score = (hole, round) => {
  if( !round ) return null;
  const ret = find(round.scores, s => s.hole == hole);
  if( !ret ) return null;
  //console.log('get_score', ret);
  return ret;
};


export const get_score_value = (name, score) => {
  if( score && score.values ) {
    const ret = find(score.values, val => val.k == name);
    if( !ret || !ret.v ) return null;
    //console.log('get_score_value', ret);
    return ret.v;
  } else {
    return null;
  }
};


export const get_net_score = (gross, score) => {
  if( !score || !score.pops ) return gross;
  const g = parseFloat(gross);
  const p = parseFloat(score.pops);
  //console.log('g', g, 'p', p);
  return (g-p).toString();
}