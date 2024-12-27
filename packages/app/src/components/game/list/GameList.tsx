import {FlatList, View} from 'react-native';
import {GameListItem} from '@/components/game/list/GameListItem';
import {ListOfGames} from '@/schema/games';

export function GameList({games}: {games: ListOfGames}) {
  const deleteGame = (id: string) => {
    const idx = games.findIndex(game => game!.id === id);
    games.splice(idx, 1);
  };

  return (
    <View>
      <FlatList
        data={games}
        renderItem={({item}) => (
          <GameListItem game={item!} deleteGame={deleteGame} />
        )}
        keyExtractor={item => item!.id}
      />
    </View>
  );
}
