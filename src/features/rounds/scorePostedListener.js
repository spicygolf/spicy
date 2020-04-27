import React from 'react';
import { useApolloClient, useSubscription } from '@apollo/client';

import { SCORE_POSTED_SUBSCRIPTION } from 'features/rounds/graphql';
import { updateRoundScoreCache } from 'common/utils/rounds';



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
    //console.log('cache data', cache.data);
    const score = data.scorePosted.scores[0];
    updateRoundScoreCache({
      cache,
      rkey,
      score,
    });
  }

  // non-display component
  return null;

};

export default ScorePostedListener;
