import React from "react";
import { SafeAreaView, Text, View } from "react-native";
import Back from "@/components/Back";

export default function NewGameScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <View className="flex m-3">
        <Back />
        <Text className="text-black dark:text-white">New Game</Text>
      </View>
    </SafeAreaView>
  );
}
