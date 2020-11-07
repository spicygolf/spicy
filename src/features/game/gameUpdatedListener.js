import React from 'react';
import { useApolloClient, useSubscription } from '@apollo/client';

import { GAME_UPDATED_SUBSCRIPTION } from 'features/game/graphql';



const GameUpdatedListener = props => {

  const { gkey } = props;
  if( !gkey ) return null;
  const { cache } = useApolloClient();

  const { loading, error, data } = useSubscription(
    GAME_UPDATED_SUBSCRIPTION,
    { variables: { gkey } },
  );

  if( loading ) {
    //console.log('loading');
    return null;
  }
  if( error ) {
    console.log('Error in GameUpdatedListener', error);
    return null;
  }

  if( data && data.gameUpdated ) {
    //console.log('gameUpdated', data);
  }

  // non-display component
  return null;

};

export default GameUpdatedListener;
