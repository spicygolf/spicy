import {Button, SafeAreaView, Text, View} from 'react-native';
import {useAccount, useCoState} from 'providers/jazz';
import {useColorScheme} from 'nativewind';

export default function ProfileScreen() {
  const {me, logOut} = useAccount();
  // const user = useCoState(PlayerAccount, me.id, [{}]);
  // const profile = useCoState(PlayerProfile, user?.profile?.id, [{}]);

  const {colorScheme, setColorScheme} = useColorScheme();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <View className="flex items-center m-3">
        <Text className="text-black dark:text-white">{me.profile?.name}</Text>
        <Text className="text-slate-400 dark:text-slate-600">{me.id}</Text>
        <Button title="Log Out" onPress={logOut} />
      </View>
      <View className="flex flex-row items-center m-3">
        <Text className="text-black dark:text-white">Theme: </Text>
        {/* TODO: make this a ButtonGroup or similar */}
        <Button title="light" onPress={() => setColorScheme('light')} />
        <Button title="dark" onPress={() => setColorScheme('dark')} />
        <Button title="system" onPress={() => setColorScheme('system')} />
      </View>
    </SafeAreaView>
  );
}
