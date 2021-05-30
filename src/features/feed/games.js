import React, { useContext, } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ListItem,
} from 'react-native-elements';
import { useQuery } from '@apollo/client';
import { format } from 'date-fns';

import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { GAMES_FOR_PLAYER_FEED } from 'features/feed/graphql';
import { getCoursesPlayersTxt } from 'common/utils/game';



const Games = props => {

  const { currentPlayer: cp } = useContext(CurrentPlayerContext);
  if( !cp ) return null;

  const { route } = props;
  const { stat, begDate, endDate } = route.params;

  const currentPlayer = `players/${cp._key}`
  const myClubs = cp.clubs.map(c => `clubs/${c._key}`);

  console.log('variables', {stat, begDate, endDate, currentPlayer, myClubs});

  const { loading, error, data } = useQuery(GAMES_FOR_PLAYER_FEED, {
    variables: { stat, begDate, endDate, currentPlayer, myClubs, }
  });

  const buildSubtitle = game => {
    //console.log('game', game);
    const { coursesTxt, playersTxt } = getCoursesPlayersTxt(game);

    const startTime = format(new Date(game.start), 'PPp');

    return (
      <View>
        <Text style={styles.subtitle}>{`${coursesTxt} - ${playersTxt}`}</Text>
        <Text style={styles.subtitle}>{startTime || ''}</Text>
      </View>
    );

  };

  const renderGame = ({item}) => {
    if( !item ) return null;
    const name = item.name || '';
    const subtitle = buildSubtitle(item);

    return (
      <ListItem
        onPress={() => itemPressed(item)}
      >
        <ListItem.Content>
          <ListItem.Title style={styles.title}>{name}</ListItem.Title>
          <ListItem.Subtitle>{subtitle}</ListItem.Subtitle>
        </ListItem.Content>
        <ListItem.Chevron
          type='material'
          name='chevron-right'
          color='#999'
          size={24}
          onPress={() => itemPressed(item)}
        />
      </ListItem>
    );
  };

  if( data && data.gamesForPlayerFeed ) {
    return (
      <FlatList
        data={data.gamesForPlayerFeed}
        renderItem={renderGame}
        keyExtractor={g => g._key}
      />
    );
  } else {
    return (<ActivityIndicator />)
  }
};

export default Games;


const styles = StyleSheet.create({
  title: {
    color: '#111',
  },
  subtitle: {
    color: '#666',
    fontSize: 12,
  },
});