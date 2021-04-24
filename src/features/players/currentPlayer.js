import { useContext, useEffect, } from 'react';
import { useQuery } from '@apollo/client';
import { GET_PLAYER_QUERY } from './graphql/getPlayer';

import { CurrentPlayerContext } from 'features/players/currentPlayerContext';



const CurrentPlayer = props => {

  const { pkey } = props;

  const { setCurrentPlayer } = useContext(CurrentPlayerContext);

  const { error, data } = useQuery(GET_PLAYER_QUERY, {
    variables: {
      player: pkey,
    },
    fetchPolicy: 'cache-and-network',
  });

  if (error && error.message != 'Network request failed' ) {
    console.log('Error fetching current player', error);
  }

  useEffect(
    () => {
      if( data && data.getPlayer ) {
        //console.log('setCurrentPlayer', data.getPlayer);
        setCurrentPlayer(data.getPlayer);
      }
    }, [data]
  );

  return null;
};

export default CurrentPlayer;
