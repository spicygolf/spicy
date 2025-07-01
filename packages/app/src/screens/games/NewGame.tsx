import React from 'react';
import { View } from 'react-native';
import { useAccount, useCoState } from 'jazz-tools/react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Back } from '@/components/Back';
import { SpecList } from '@/components/game/new/SpecList';
import { ListOfGameSpecs } from '@/schema/gamespecs';
import { Screen, Text } from '@/ui';

export function NewGame() {
  const { me } = useAccount();
  const specs = useCoState(ListOfGameSpecs, me.root?.specs?.id, [{}]);

  return (
    <Screen>
      <View>
        <View style={styles.row}>
          <Back home={{ name: 'GamesList' }} />
          <View style={styles.title}>
            <Text style={styles.titleText}>New Game</Text>
          </View>
        </View>
        <SpecList specs={specs || undefined} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 24,
  },
});
