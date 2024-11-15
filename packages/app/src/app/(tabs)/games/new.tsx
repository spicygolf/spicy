import React from "react";
import { FlatList, SafeAreaView, Text, View } from "react-native";
import Back from "@/components/Back";
import { useAccount, useCoState } from "@/providers/jazz";
import { GameSpec, ListOfGameSpecs } from "@/schema/gamespecs";

export default function NewGameScreen() {
  const { me } = useAccount();
  const specs = useCoState(ListOfGameSpecs, me.root?.specs?.id, [{}]);
  if (!specs) {
    GameSpec.seedRootSpecs(me);
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <View className="flex m-3">
        <Back />
        <FlatList
          data={specs}
          renderItem={({ item }) => <Text>{item.name}</Text>}
          keyExtractor={(item) => item.id}
        />
      </View>
    </SafeAreaView>
  );
}
