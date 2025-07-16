import React from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { Game } from '@/schema/games';
import { Link, Text } from '@/ui';

export function GameListItem({
  game,
  deleteGame,
}: {
  game: Game | null;
  deleteGame: (id: string) => void;
}) {
  if (!game) return null;
  return (
    <Link
      href={{
        path: `/games/${game.id}/settings`,
      }}
      style={styles.container}
    >
      <View style={styles.game}>
        <Text style={styles.gameName}>{game.name}</Text>
        <Text style={styles.gameDateTime}>
          {game.start.toLocaleDateString()} - {game.start.toLocaleTimeString()}
        </Text>
      </View>
      <Pressable
        onPress={e => {
          e.preventDefault();
          deleteGame(game.id);
        }}
        style={styles.actions}
      >
        <Text>X</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.gap(1),
  },
  game: {
    flex: 1,
  },
  actions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameDateTime: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
}));
