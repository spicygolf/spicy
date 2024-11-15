import { Button, SafeAreaView, Switch, Text, View } from "react-native";
import { useColorScheme } from "nativewind";

export default function ProfileScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <View className="flex flex-row items-center m-3 bg-white dark:bg-neutral-900">
        <Text className="text-black dark:text-white">Theme: </Text>
        {/* TODO: make this a ButtonGroup or similar */}
        <Button title="light" onPress={() => setColorScheme("light")} />
        <Button title="dark" onPress={() => setColorScheme("dark")} />
        <Button title="system" onPress={() => setColorScheme("system")} />
      </View>
    </SafeAreaView>
  );
}
