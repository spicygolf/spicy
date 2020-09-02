import { cloneDeep, find, findIndex } from 'lodash';

import {
  ROUND_POSTING_FRAGMENT,
  ROUND_SCORES_FRAGMENT
} from 'features/rounds/graphql';



export const get_round_for_player = (rounds, pkey) => {

  const ret = find(rounds, r => {
    if( r && r.player[0] && r.player[0]._key ) {
      return (r.player[0]._key == pkey);
    } else {
      return null;
    }
  });
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


export const get_net_score = (gross, score) => {
  if( !score || !score.pops ) return gross;

  const g = parseFloat(gross);
  const p = parseFloat(score.pops);
  //console.log('g', g, 'p', p);
  let net = (g-p).toString();
  if( isNaN(net) ) net = null;
  return net;
}

export const get_pops = score => {
  return (score && score.pops) ? parseFloat(score.pops) : 0;
};

export const rmround = async (rkey, mutation) => {
  const { loading, error, data } = await mutation({
    variables: {
      rkey: rkey
    },
  });
  if( error ) {
    console.log('error removing round', error);
    console.log('rmround', rkey);
    return null;
  }
  return data;

};


export const updateRoundScoreCache = ({cache, rkey, score}) => {

  // read scores from cache
  const optimistic = true;
  const cRound = cache.readFragment({
    id: rkey,
    fragment: ROUND_SCORES_FRAGMENT,
  }, optimistic);

  // make new scores to write back
  const newScores = cloneDeep(cRound.scores);
  const h = findIndex(newScores, {hole: score.hole});
  newScores[h].values = score.values;

  // write back to cache
  cache.writeFragment({
    id: rkey,
    fragment: ROUND_SCORES_FRAGMENT,
    data: {
      scores: newScores,
    },
  });

};


export const updateRoundPostedCache = ({cache, rkey, posting}) => {
  //console.log('cache before round posting update', cache.data.data[rkey]);
  // read from cache
  const optimistic = true;
  const cRound = cache.readFragment({
    id: rkey,
    fragment: ROUND_POSTING_FRAGMENT,
  }, optimistic);
  //console.log('round from cache', cRound);
  //console.log('posting to update cache', posting);

  // write back to cache with new values
  cache.writeFragment({
    id: rkey,
    fragment: ROUND_POSTING_FRAGMENT,
    data: {
      posting,
    },
  });
  //console.log('cache after round posting update', cache.data.data[rkey]);
};

