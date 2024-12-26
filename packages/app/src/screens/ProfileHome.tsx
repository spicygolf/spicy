import {Button, SafeAreaView, Text, View} from 'react-native';
import {useAccount, useCoState} from 'providers/jazz';

export default function ProfileScreen() {
  const {me, logOut} = useAccount();
  // const user = useCoState(PlayerAccount, me.id, [{}]);
  // const profile = useCoState(PlayerProfile, user?.profile?.id, [{}]);

  const setColorScheme = (scheme: string) => {
    console.log('setColorScheme', scheme);
  };

  return (
    <SafeAreaView>
      <View>
        <Text>{me.profile?.name}</Text>
        <Text>{me.id}</Text>
        <Button title="Log Out" onPress={logOut} />
      </View>
      <View>
        <Text>Theme: </Text>
        {/* TODO: make this a ButtonGroup or similar */}
        <Button title="light" onPress={() => setColorScheme('light')} />
        <Button title="dark" onPress={() => setColorScheme('dark')} />
        <Button title="system" onPress={() => setColorScheme('system')} />
      </View>
    </SafeAreaView>
  );
}
