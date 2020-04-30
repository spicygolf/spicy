import React from 'react';
import { useApolloClient, useSubscription } from '@apollo/client';

import { GAME_UPDATED_SUBSCRIPTION } from 'features/game/graphql';
import { updateGameHolesCache } from 'common/utils/game';



const GameUpdatedListener = props => {

  const { gkey } = props;
  if( !gkey ) return null;
  const client = useApolloClient();

  const { loading, error, data } = useSubscription(
    GAME_UPDATED_SUBSCRIPTION,
    { variables: { gkey } },
  );

  if( loading ) return null;
  if( error ) console.log('Error in GameUpdatedListener', error);

  if( data && data.gameUpdated ) {
    console.log('gameUpdated', data);
    const { cache } = client;
    //console.log('cache data', cache.data);
    const { holes } = data.gameUpdated;
    if( holes ) {
      updateGameHolesCache({
        cache,
        gkey,
        holes,
      });
    }

  }

  // non-display component
  return null;

};

export default GameUpdatedListener;
