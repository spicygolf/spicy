import React, { useContext, } from 'react';
import {
  Text,
  View,
} from 'react-native';
import {
  Card,
} from 'react-native-elements';
import { useQuery } from '@apollo/client';

import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { GAMES_FOR_PLAYER_FEED } from 'features/feed/graphql';
console.log('query', GAMES_FOR_PLAYER_FEED);


const Games = props => {

  const { currentPlayer: cp } = useContext(CurrentPlayerContext);

  const begDate = '2021-01-01';
  const currentPlayer = `players/${cp._key}`
  const myClubs = cp.clubs.map(c => `clubs/${c._key}`);

  console.log('variables', {begDate, currentPlayer, myClubs});

  const { loading, error, data } = useQuery(GAMES_FOR_PLAYER_FEED, {
    variables: { begDate, currentPlayer, myClubs, }
  });

  if( data ) console.log('data', data.gamesForPlayerFeed);

  return (
    <Card>
      <Text>games</Text>
    </Card>
  );
};

export default Games;

