import { find } from 'lodash';

export const get_round_for_player = (rounds, pkey) => {
  const ret = find(rounds, (r) => {
    if (r && r.player[0] && r.player[0]._key) {
      return r.player[0]._key === pkey;
    } else {
      return null;
    }
  });
  //console.log('get_round_for_player', ret);
  return ret;
};

// given a hole (string, "1") and round, return the course's 'hole' object
export const get_hole = (hole, round) => {
  if (round?.tees?.length > 0) {
    if (round.tees.length === 1) {
      const ret = find(round.tees[0]?.holes, (h) => h.number.toString() === hole);
      //console.log('hole', hole);
      return ret;
    } else {
      // TODO: handle a round with more than one tee
      console.log('TODO: handle a round with more than one tee');
      return null;
    }
  } else {
    return null;
  }
};

// hole int, round {}
export const get_score = (hole, round) => {
  if (!round) {
    return null;
  }
  const ret = find(round.scores, (s) => s.hole === hole);
  if (!ret) {
    return null;
  }
  //console.log('get_score', ret);
  return ret;
};

export const get_score_value = (name, score) => {
  if (score && score.values) {
    const ret = find(score.values, (val) => val.k === name);
    if (!ret || !ret.v) {
      return null;
    }
    //console.log('get_score_value', ret);
    return parseFloat(ret.v);
  } else {
    return null;
  }
};

export const get_net_score = (gross, score) => {
  const g = parseFloat(gross);
  if (!score || !score.pops) {
    return g;
  }
  const p = parseFloat(score.pops);
  //console.log('g', g, 'p', p);
  let net = g - p;
  if (isNaN(net)) {
    net = null;
  }
  return net;
};

export const get_pops = (score) => {
  //console.log('score', score);
  return score && score.pops ? parseFloat(score.pops) : 0;
};

export const rmround = async (rkey, mutation) => {
  const { error, data } = await mutation({
    variables: {
      rkey: rkey,
    },
  });
  if (error) {
    console.log('error removing round', error);
    console.log('rmround', rkey);
    return null;
  }
  return data;
};
