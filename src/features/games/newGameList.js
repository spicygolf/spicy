import React, { useContext, useState } from 'react';

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
    return (
      <ListItem
        roundAvatar
        title={item.disp || ''}
        titleStyle={styles.title}
        subtitle={item.type || ''}
        subtitleStyle={styles.subtitle}
        onPress={() => gamespecPressed(item)}
        testID={`new_${item._key}`}
      />
    );
  };

  const { data, loading, error} = useQuery(GAMESPECS_FOR_PLAYER_QUERY, {
    variables: {
      pkey: currentPlayerKey,
    },
    fetchPolicy: 'cache-and-network',
  });

  if( loading ) return (<ActivityIndicator />);

  // TODO: error component instead of below...
  if( error || !data.gameSpecsForPlayer ) {
    console.log(error);
    return (<Text>Error</Text>);
  }

  return (
    <View>
      <GameNav
        title='New Game'
        showBack={true}
      />
      <FlatList
        data={data.gameSpecsForPlayer}
        renderItem={_renderItem}
        keyExtractor={item => item._key}
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