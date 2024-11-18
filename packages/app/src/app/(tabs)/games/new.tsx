import React from "react";
import { SafeAreaView, Text, View } from "react-native";
import Back from "@/components/Back";
import { useAccount, useCoState } from "@/providers/jazz";
import { ListOfGameSpecs } from "@/schema/gamespecs";
import SpecList from "@/components/game/new/SpecList";

export default function NewGameScreen() {
  const { me } = useAccount();
  const specs = useCoState(ListOfGameSpecs, me.root?.specs?.id, [{}]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <View className="flex m-3">
        <View className="flex flex-row">
          <Back home="/games/list" />
          <View className="flex flex-1 justify-center items-center">
            <Text className="text-lg text-black dark:text-white">New Game</Text>
          </View>
        </View>
        <SpecList specs={specs!} />
      </View>
    </SafeAreaView>
  );
}
