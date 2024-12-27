import React from 'react';
import { Button, View } from 'react-native';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import {
  StyleSheet,
  UnistylesRuntime,
  UnistylesThemes,
} from 'react-native-unistyles';
import { useAccount } from '@/providers/jazz';
import { MMKVStore } from '@/providers/jazz/mmkv-store';
import { Screen, Text } from '@/ui';

export default function ProfileScreen() {
  const { me, logOut } = useAccount();
  // const user = useCoState(PlayerAccount, me.id, [{}]);
  // const profile = useCoState(PlayerProfile, user?.profile?.id, [{}]);

  const reset = () => {
    const store = new MMKVStore();
    store.clearAll();
  };

  const themes = ['light', 'dark', 'system'];
  const setTheme = (scheme: number) => {
    const system =
      UnistylesRuntime.colorScheme === 'dark'
        ? themes.indexOf('dark')
        : themes.indexOf('light');
    if (scheme === themes.indexOf('system')) {
      scheme = system;
    }
    const themeName = themes[scheme] as keyof UnistylesThemes;
    UnistylesRuntime.setTheme(themeName);
    const theme = UnistylesRuntime.getTheme(themeName);
    UnistylesRuntime.setRootViewBackgroundColor(theme.colors.background);
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={styles.label}>Logged in as:</Text>
          <Text>{me.profile?.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Account ID:</Text>
          <Text>{me.id}</Text>
        </View>
        <View>
          <Button title="Log Out" onPress={logOut} />
        </View>
        <View>
          <Button title="Reset App" onPress={reset} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Theme:</Text>
          <SegmentedControl
            values={themes}
            selectedIndex={2}
            onChange={event => setTheme(event.nativeEvent.selectedSegmentIndex)}
            sliderStyle={styles.themeTabs}
            fontStyle={styles.themeInactiveFont}
            activeFontStyle={styles.themeActiveFont}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 10,
    // justifyContent: 'flex-start',
    // alignItems: 'flex-start',
  },
  row: {
    // flex: 2,
    // flexDirection: 'row',
    // alignItems: 'center',
  },
  label: {
    // flex: 1,
  },
  themeTabs: {
    // flex: 1,
    backgroundColor: '#666',
  },
  themeActiveFont: {
    color: '#24a0ed',
  },
  themeInactiveFont: {
    color: 'gray',
  },
});
