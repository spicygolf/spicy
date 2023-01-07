import { useNavigation } from '@react-navigation/native';
import { GameListContext } from 'features/games/gameListContext';
import React, { useContext } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ListItem } from 'react-native-elements';

const NewGameList = (props) => {
  const navigation = useNavigation();

  const { gameList } = useContext(GameListContext);
  if (!gameList) {
    return null;
  }
  const { gamespecs, total } = gameList;

  const gamespecPressed = async (gamespec) => {
    navigation.navigate('NewGameInfo', {
      gamespec: gamespec,
    });
  };

  // `item` is a gamespec
  const renderItem = ({ item }) => {
    const { gamespec, player_count } = item;
    let pct = total === 0 ? '' : Math.round((100 * player_count) / total) + '%';
    let cnt = total === 0 ? '' : ' - ' + player_count;
    return (
      <ListItem onPress={() => gamespecPressed(gamespec)} testID={`new_${gamespec._key}`}>
        <ListItem.Content>
          <ListItem.Title style={styles.title}>{gamespec.disp || ''}</ListItem.Title>
          <ListItem.Subtitle style={styles.subtitle}>
            {gamespec.type || ''}
          </ListItem.Subtitle>
        </ListItem.Content>
        <Text style={styles.subtitle}>
          {pct}
          {cnt}
        </Text>
      </ListItem>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={gamespecs}
        renderItem={renderItem}
        keyExtractor={(item) => item.gamespec._key}
      />
    </View>
  );
};

export default NewGameList;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
  },
  subtitle: {
    color: '#666',
    fontSize: 12,
  },
  title: {
    color: '#111',
  },
});
