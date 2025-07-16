import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Back } from '@/components/Back';
import { SpecList } from '@/components/game/new/SpecList';
import { useGamespecs } from '@/hooks';
import { Screen, Text } from '@/ui';

export function NewGame() {
  const specs = useGamespecs();
  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Back home={{ name: 'GamesList' }} />
          <View style={styles.title}>
            <Text style={styles.titleText}>New Game</Text>
          </View>
        </View>
        <SpecList specs={specs} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    padding: theme.gap(2),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.gap(2),
  },
  title: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
}));
