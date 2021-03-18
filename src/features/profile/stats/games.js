import React from 'react';
import {
  Text,
  View,
} from 'react-native';
import { useQuery } from '@apollo/client';

import { ACTIVE_GAMES_FOR_PLAYER_QUERY } from 'features/games/graphql';
import { styles } from './styles';



const GamesStat = ({pkey}) => {

  const { error, data } = useQuery(ACTIVE_GAMES_FOR_PLAYER_QUERY, {
    variables: {
      pkey,
    },
    fetchPolicy: 'cache-and-network',
  });
  if (error && error.message != 'Network request failed') {
    return (<Text>Error! {error.message}</Text>);
  }

  const stat = ( data && data.activeGamesForPlayer )
  ? data.activeGamesForPlayer.length
  : ' ';

  return (
    <View style={styles.stat_view}>
      <View><Text style={styles.stat_value}>{stat}</Text></View>
      <View><Text style={styles.stat_label}>games</Text></View>
    </View>
  );
};

export default GamesStat;
