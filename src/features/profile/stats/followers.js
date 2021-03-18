import React from 'react';
import {
  Text,
  View,
} from 'react-native';
import { useQuery } from '@apollo/client';

import { GET_PLAYERS_FOLLOWERS_QUERY } from 'features/players/graphql';

import { styles } from './styles';



const FollowersStat = ({pkey}) => {

  const { error, data } = useQuery(GET_PLAYERS_FOLLOWERS_QUERY, {
    variables: {
      pkey,
    },
    fetchPolicy: 'cache-and-network',
  });
  if (error && error.message != 'Network request failed') {
    return (<Text>Error! {error.message}</Text>);
  }

  const stat = ( data && data.getPlayersFollowers )
  ? data.getPlayersFollowers.length
  : ' ';

  return (
    <View style={styles.stat_view}>
      <View><Text style={styles.stat_value}>{stat}</Text></View>
      <View><Text style={styles.stat_label}>followers</Text></View>
    </View>
  );
};

export default FollowersStat;
