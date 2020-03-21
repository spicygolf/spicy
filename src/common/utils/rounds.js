
import { find } from 'lodash';



export const get_round_for_player = (rounds, pkey) => {
  const ret = find(rounds, r => r.player[0]._key == pkey);
  //console.log('get_round_for_player', ret);
  return ret;
};


// given a hole (string, "1") and round, return the course's 'hole' object
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


export const get_net_score = (gross, score, gkey) => {
  if( !score || !score.pops || !gkey ) return gross;
  const pops = find(score.pops, { gkey: gkey });
  if( !pops ) return gross;
  //console.log('pops', pops);

  const g = parseFloat(gross);
  const p = parseFloat(pops.pops);
  //console.log('g', g, 'p', p);
  return (g-p).toString();
}
