import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useQuery } from '@apollo/react-hooks';
import { Icon, ListItem } from 'react-native-elements';
import moment from 'moment';
import { reverse, sortBy } from 'lodash';

import { ACTIVE_GAMES_FOR_PLAYER_QUERY } from 'features/games/graphql';
import { blue } from 'common/colors';



const GameList = ({currentPlayerKey, navigation}) => {

  const newGamePressed = () => {
    navigation.navigate(
      'NewGame',
      {currentPlayerKey: currentPlayerKey}
    );
  };

  const itemPressed = (item, setup) => {
    navigation.navigate('Game', {
      currentGameKey: item._key,
      currentPlayerKey: currentPlayerKey,
      setup: setup
    });
  };

  const renderItem = ({item}) => {
    if( !item || !item.gametype ) return null;
    const startTime = moment(item.start).format('llll');
    return (
      <ListItem
        title={item.name || ''}
        subtitle={startTime || ''}
        onPress={() => itemPressed(item, false)}
        rightIcon={
          <Icon
            name='settings'
            color='#999'
            onPress={() => itemPressed(item, true)}
          />
        }
      />
    );
  }

  const { loading, error, data } = useQuery(ACTIVE_GAMES_FOR_PLAYER_QUERY,  {
    variables: {
      pkey: currentPlayerKey,
    },
    fetchPolicy: 'cache-and-network',
  });

  if( loading ) return (<ActivityIndicator />);
  if (error) return (<Text>Error! ${error.message}</Text>);

  const games = (data && data.activeGamesForPlayer ) ?
    data.activeGamesForPlayer : [];
  // sort games descending by start time
    const sorted_games = reverse(sortBy(games, ['start']));

  return (
    <View>
      <View style={styles.gamesSubMenu}>
        <View style={styles.newGameButton}>
          <Icon
            name='add-circle'
            color={blue}
            size={40}
            onPress={newGamePressed}
            accessibilityLabel="New Game"
            testID='new_game'
          />
        </View>
      </View>
      <FlatList
        data={sorted_games}
        renderItem={renderItem}
        keyExtractor={item => item._key}
      />
    </View>
  );

}

export default GameList;




const styles = StyleSheet.create({
  gamesSubMenu: {
    alignItems: 'flex-end',
    paddingRight: 10,
    paddingTop: 10,
  },
  gamesSubMenuSpacer: {
  },
  newGameButton: {
  }
});
