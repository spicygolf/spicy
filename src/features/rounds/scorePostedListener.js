import React from 'react';
import { useApolloClient, useSubscription } from '@apollo/client';
import { cloneDeep, findIndex } from 'lodash';

import {
  ROUND_SCORES_FRAGMENT,
  SCORE_POSTED_SUBSCRIPTION
} from 'features/rounds/graphql';



const ScorePostedListener = props => {

  const { rkey } = props;
  if( !rkey ) return null;
  const client = useApolloClient();

  const { loading, error, data } = useSubscription(
    SCORE_POSTED_SUBSCRIPTION,
    { variables: { rkey } },
  );

  if( loading ) return null;
  if( error ) console.log('Error in ScorePostedListener', error);

  if( data && data.scorePosted ) {
    const { cache } = client;
    //console.log('cache', cache);
    //console.log('scorePosted', data.scorePosted);
    const score = data.scorePosted.scores[0];

    // read scores from cache
    const optimistic = true;
    const cRound = cache.readFragment({
      id: rkey,
      fragment: ROUND_SCORES_FRAGMENT,
    }, optimistic);
    //console.log('getRound from cache', cRound);

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
  }

  // non-display component
  return null;

};

export default ScorePostedListener;
