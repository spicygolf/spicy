import React, { useContext } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';
import {
  Icon,
  ListItem
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@apollo/react-hooks';
import moment from 'moment';
import { reverse, sortBy } from 'lodash';

import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { ACTIVE_GAMES_FOR_PLAYER_QUERY } from 'features/games/graphql';
import { blue } from 'common/colors';



const Games = props => {

  const navigation = useNavigation();
  const { currentPlayerKey } = useContext(CurrentPlayerContext);

  const newGamePressed = () => {
    navigation.navigate('NewGame');
  };

  const itemPressed = (item, setup) => {
    navigation.navigate('Game', {
      currentGameKey: item._key,
      setup: setup
    });
  };

  const renderItem = ({item}) => {
    if( !item ) return null;
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

  //console.log('currentPlayerKey', currentPlayerKey);
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
    <View style={styles.container}>
      <View style={styles.gamesSubMenu}>
        <View>
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

export default Games;




const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  gamesSubMenu: {
    alignItems: 'center',
    paddingTop: 10,
  },
});
