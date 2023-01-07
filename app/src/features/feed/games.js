import { useQuery } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import { getCoursesPlayersTxt } from 'common/utils/game';
import { format } from 'date-fns';
import { GAMES_FOR_PLAYER_FEED } from 'features/feed/graphql';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import React, { useContext } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { ListItem } from 'react-native-elements';

const Games = (props) => {
  const navigation = useNavigation();
  const { currentPlayer: cp } = useContext(CurrentPlayerContext);
  const { route } = props;
  const { stat, begDate, endDate } = route.params;

  const currentPlayer = `players/${cp._key}`;
  const myClubs = cp.handicap.clubs.map((c) => `${c.id}`);

  // console.log('variables', {stat, begDate, endDate, currentPlayer, myClubs});

  const { data } = useQuery(GAMES_FOR_PLAYER_FEED, {
    variables: { stat, begDate, endDate, currentPlayer, myClubs },
  });

  const buildSubtitle = (game) => {
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

  const gamePressed = (item) => {
    console.log(item);
    navigation.navigate('GamesStack', {
      screen: 'Game',
      params: {
        currentGameKey: item._key,
        readonly: true,
      },
    });
  };

  const renderGame = ({ item }) => {
    if (!item) {
      return null;
    }
    const name = item.name || '';
    const subtitle = buildSubtitle(item);

    return (
      <ListItem onPress={() => gamePressed(item)}>
        <ListItem.Content>
          <ListItem.Title style={styles.title}>{name}</ListItem.Title>
          <ListItem.Subtitle>{subtitle}</ListItem.Subtitle>
        </ListItem.Content>
        <ListItem.Chevron
          type="material"
          name="chevron-right"
          color="#999"
          size={24}
          onPress={() => gamePressed(item)}
        />
      </ListItem>
    );
  };

  if (!cp) {
    return null;
  }

  if (data && data.gamesForPlayerFeed) {
    return (
      <FlatList
        data={data.gamesForPlayerFeed}
        renderItem={renderGame}
        keyExtractor={(g) => g._key}
      />
    );
  } else {
    return <ActivityIndicator />;
  }
};

export default Games;

const styles = StyleSheet.create({
  subtitle: {
    color: '#666',
    fontSize: 12,
  },
  title: {
    color: '#111',
  },
});
