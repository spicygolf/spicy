import { useQuery } from '@apollo/client';
import { ACTIVE_GAMES_FOR_PLAYER_QUERY } from 'features/games/graphql';
import React from 'react';
import { Text, View } from 'react-native';

import { styles } from './styles';

const GamesStat = ({ pkey }) => {
  let stat = ' ';

  const { error, data } = useQuery(ACTIVE_GAMES_FOR_PLAYER_QUERY, {
    variables: {
      pkey,
    },
    fetchPolicy: 'cache-and-network',
  });
  if (error && error.message != 'Network request failed') {
    stat = '?';
  }

  if (data && data.activeGamesForPlayer) {
    stat = data.activeGamesForPlayer.length;
  }

  return (
    <View style={styles.stat_view}>
      <View>
        <Text style={styles.stat_value}>{stat}</Text>
      </View>
      <View>
        <Text style={styles.stat_label}>games</Text>
      </View>
    </View>
  );
};

export default GamesStat;
