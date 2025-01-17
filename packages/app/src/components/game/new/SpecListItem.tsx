import React, { useContext } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useAccount } from 'jazz-react-native';
import { co } from 'jazz-tools';
import { StyleSheet } from 'react-native-unistyles';
import { GamesNavigatorParamList } from '@/navigators/GamesNavigator';
import { GameContext } from '@/providers/game';
import { Game } from '@/schema/games';
import { GameSpec } from '@/schema/gamespecs';
import { Text } from '@/ui';

export function SpecListItem({ spec }: { spec: co<GameSpec | null> }) {
  const navigation = useNavigation<NavigationProp<GamesNavigatorParamList>>();
  const { me } = useAccount();
  const { setGame } = useContext(GameContext);
  if (!spec) return null;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => {
          const game = Game.createGame(spec, me);
          setGame(game);
          navigation.navigate('Game', { screen: 'GameSettings' });
        }}>
        <View style={styles.specContainer}>
          <Text style={styles.specName}>{spec.name}</Text>
          <Text style={styles.specSub}>
            {spec.spec_type} - {spec.short}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specContainer: {
    flex: 10,
    flexDirection: 'column',
    marginVertical: 2,
  },
  specName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  specSub: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
}));
