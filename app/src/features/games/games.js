import { useLazyQuery } from '@apollo/client';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { blue } from 'common/colors';
import { getCoursesPlayersTxt } from 'common/utils/game';
import { ACTIVE_GAMES_FOR_PLAYER_QUERY } from 'features/games/graphql';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { filter, reverse, sortBy } from 'lodash';
import moment from 'moment';
import React, { useCallback, useContext, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon, ListItem } from 'react-native-elements';

const Games = (props) => {
  const navigation = useNavigation();
  const { currentPlayerKey } = useContext(CurrentPlayerContext);
  //console.log('currentPlayerKey', currentPlayerKey);
  const [isFetching, setIsFetching] = useState(false);

  const newGamePressed = () => {
    navigation.navigate('NewGameScreen');
  };

  const itemPressed = (item, setup) => {
    if (setup) {
      navigation.navigate('Game', {
        currentGameKey: item._key,
        readonly: false,
        screen: 'Setup',
        params: {
          screen: 'GameSetup',
        },
      });
    } else {
      navigation.navigate('Game', {
        currentGameKey: item._key,
        readonly: false,
      });
    }
  };

  const buildSubtitle = (game) => {
    //console.log('game', game);
    const { coursesTxt, playersTxt } = getCoursesPlayersTxt(game);

    const startTime = moment(game.start).format('llll');

    return (
      <View>
        <Text style={styles.subtitle}>{`${coursesTxt} - ${playersTxt}`}</Text>
        <Text style={styles.subtitle}>{startTime || ''}</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    if (!item) {
      return null;
    }
    const name = item.name || '';
    const subtitle = buildSubtitle(item);

    return (
      <ListItem onPress={() => itemPressed(item, false)}>
        <ListItem.Content>
          <ListItem.Title style={styles.title}>{name}</ListItem.Title>
          <ListItem.Subtitle>{subtitle}</ListItem.Subtitle>
        </ListItem.Content>
        <ListItem.Chevron
          type="material"
          name="settings"
          color="#999"
          size={24}
          onPress={() => itemPressed(item, true)}
        />
      </ListItem>
    );
  };

  useFocusEffect(
    React.useCallback(() => {
      //console.log('Games List focused');
      fetchGameList();
    }, [fetchGameList]),
  );

  const fetchGameList = useCallback(() => {
    //console.log('fetchGameList');
    setIsFetching(true);
    getGameList();
    setIsFetching(false);
  }, [getGameList]);

  const [getGameList, { error, data }] = useLazyQuery(ACTIVE_GAMES_FOR_PLAYER_QUERY, {
    variables: {
      pkey: currentPlayerKey,
    },
    fetchPolicy: 'cache-and-network',
  });
  if (error && error.message !== 'Network request failed') {
    return <Text>Error! {error.message}</Text>;
  }

  const games = data && data.activeGamesForPlayer ? data.activeGamesForPlayer : [];
  const filtered_games = filter(games, (g) => g);
  // sort games descending by start time
  const sorted_games = reverse(sortBy(filtered_games, ['start']));
  //console.log('sorted_games', sorted_games);

  return (
    <View style={styles.container}>
      <View style={styles.gamesSubMenu}>
        <View>
          <TouchableOpacity onPress={newGamePressed} style={styles.newGameButton}>
            <Icon
              name="add-circle"
              color={blue}
              size={40}
              accessibilityLabel="New Game"
              testID="new_game"
            />
            <Text style={styles.newGameText}>New Game</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={sorted_games}
        renderItem={renderItem}
        onRefresh={() => fetchGameList()}
        refreshing={isFetching}
        keyExtractor={(item) => item._key}
      />
    </View>
  );
};

export default Games;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
  },
  gamesSubMenu: {
    alignItems: 'center',
    paddingTop: 10,
  },
  newGameButton: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  newGameText: {
    color: blue,
    paddingLeft: 5,
  },
  subtitle: {
    color: '#666',
    fontSize: 12,
  },
  title: {
    color: '#111',
  },
});
