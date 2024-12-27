import React from 'react';
import { View } from 'react-native';
import { co } from 'jazz-tools';
import { StyleSheet } from 'react-native-unistyles';
import { GameSpec } from '@/schema/gamespecs';
import { Link, Text } from '@/ui';

export function SpecListItem({ spec }: { spec: co<GameSpec | null> }) {
  if (!spec) return null;

  // TODO: figure out how to get value of co.literal
  console.log('spec.type', spec.get('type'));

  return (
    <View style={styles.row}>
      <Link
        href={{
          name: 'GameSettings',
          params: { spec },
        }}>
        <View style={styles.specContainer}>
          <Text style={styles.specName}>{spec.name.toString()}</Text>
          <Text style={styles.specSub}>
            {spec.type.toString()} - {spec.short.toString()}
          </Text>
        </View>
      </Link>
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
