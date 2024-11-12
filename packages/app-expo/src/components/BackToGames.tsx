import { router } from "expo-router";
import { Text, TouchableOpacity } from "react-native";

export default function BackToGames() {
  if (!router.canGoBack()) return null;
  return (
    <TouchableOpacity onPress={() => router.back()}>
      <Text className="font-bold text-black dark:text-white my-2">&lt;</Text>
    </TouchableOpacity>
  );
}
