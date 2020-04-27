import React from 'react';
import { useSubscription } from '@apollo/client';

import { SCORE_POSTED_SUBSCRIPTION } from 'features/rounds/graphql';



const ScorePostedListener = props => {

  const { rkey } = props;
  if( !rkey ) return null;

  const { loading, error, data } = useSubscription(
    SCORE_POSTED_SUBSCRIPTION,
    { variables: { rkey } },
  );

  if( loading ) return null;
  if( error ) console.log('Error in ScorePostedListener', error);

  if( data && data.scorePosted ) {
    console.log('scorePosted', data.scorePosted);
  }

  // non-display component
  return null;

};

export default ScorePostedListener;
