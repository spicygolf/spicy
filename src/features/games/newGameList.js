import React, { useContext } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { ListItem } from 'react-native-elements';
import { useQuery } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import { orderBy } from 'lodash';

import GameNav from 'features/games/gamenav';

import {
  GAMESPECS_FOR_PLAYER_QUERY,
} from 'features/games/graphql';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';



const NewGameList = props => {

  const { currentPlayerKey } = useContext(CurrentPlayerContext);

  const navigation = useNavigation();

  const gamespecPressed = async gamespec => {
    navigation.navigate('NewGameInfo', {
      gamespec: gamespec,
    });
  };

  // `item` is a gamespec
  const _renderItem = ({item}) => {
    const { gamespec } = item;
    return (
      <ListItem
        onPress={() => gamespecPressed(gamespec)}
        testID={`new_${gamespec._key}`}
      >
        <ListItem.Content>
          <ListItem.Title style={styles.title}>{gamespec.disp || ''}</ListItem.Title>
          <ListItem.Subtitle style={styles.subtitle}>{gamespec.type || ''}</ListItem.Subtitle>
        </ListItem.Content>
      </ListItem>
    );
  };

  const { data, loading, error } = useQuery(GAMESPECS_FOR_PLAYER_QUERY, {
    variables: {
      pkey: currentPlayerKey,
    },
  });

  if( loading ) return (<ActivityIndicator />);

  // TODO: error component instead of below...
  if( (error && error.message != "Network request failed") ) {
    console.log(error);
    return (<Text>Error: {error.message}</Text>);
  }

  console.log('data', data);
  const gameSpecsForPlayer = (data && data.gameSpecsForPlayer)
    ? orderBy(data.gameSpecsForPlayer, ['player_count'], ['desc'])
    : [];

  return (
    <View>
      <GameNav
        title='New Game'
        showBack={true}
      />
      <FlatList
        data={gameSpecsForPlayer}
        renderItem={_renderItem}
        keyExtractor={item => item.gamespec._key}
      />
    </View>
  );

};

export default NewGameList;


const styles = StyleSheet.create({
  title: {
    color: '#111',
  },
  subtitle: {
    color: '#666',
    fontSize: 12,
  },
});