import React from 'react';
import {
  Text,
  View,
} from 'react-native';
import { useQuery } from '@apollo/client';

import { GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY } from 'features/players/graphql';
import { styles } from './styles';



const FollowingStat = ({pkey}) => {

  const { error, data } = useQuery(GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY, {
    variables: {
      pkey,
    },
    fetchPolicy: 'cache-and-network',
  });
  if (error && error.message != 'Network request failed') {
    return (<Text>Error! {error.message}</Text>);
  }

  const stat = ( data && data.getFavoritePlayersForPlayer )
  ? data.getFavoritePlayersForPlayer.length
  : ' ';

  return (
    <View style={styles.stat_view}>
      <View><Text style={styles.stat_value}>{stat}</Text></View>
      <View><Text style={styles.stat_label}>following</Text></View>
    </View>
  );
};

export default FollowingStat;
