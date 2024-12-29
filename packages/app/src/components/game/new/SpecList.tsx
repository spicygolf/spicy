import React from 'react';
import { FlatList, View } from 'react-native';
import { SpecListItem } from '@/components/game/new/SpecListItem';
import { ListOfGameSpecs } from '@/schema/gamespecs';

export function SpecList({ specs }: { specs: ListOfGameSpecs | undefined }) {
  return (
    <View>
      <FlatList
        data={specs}
        renderItem={({ item }) => <SpecListItem spec={item} />}
        keyExtractor={item => item!.id}
      />
    </View>
  );
}
