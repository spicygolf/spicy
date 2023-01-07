import { useNavigation } from '@react-navigation/native';
import { dark, light } from 'common/colors';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import React, { useContext } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { Icon, ListItem } from 'react-native-elements';

const SettingsHome = (props) => {
  const { currentPlayer, impersonate } = useContext(CurrentPlayerContext);

  const navigation = useNavigation();

  const settings_data = [
    {
      key: '0',
      name: 'Account',
      icon: 'account',
      icon_type: 'material-community',
      nav: 'Account',
    },
    {
      key: '90',
      name: 'Clear Local Data',
      icon: 'delete-sweep',
      icon_type: 'material-community',
      nav: 'ClearCache',
    },
    {
      key: '99',
      name: 'Logout',
      icon: 'logout',
      icon_type: 'material-community',
      nav: 'Logout',
    },
    {
      key: '999',
      name: 'Impersonate',
      icon: 'sunglasses',
      icon_type: 'material-community',
      nav: 'Impersonate',
      level: 'admin',
    },
  ];

  const version = DeviceInfo.getVersion();

  const renderSetting = ({ item }) => {
    // console.log('impersonate', impersonate);
    if (item.level === 'admin') {
      if (
        (currentPlayer && currentPlayer.level && currentPlayer.level === 'admin') ||
        (impersonate &&
          impersonate.original &&
          impersonate.original.level &&
          impersonate.original.level === 'admin')
      ) {
        // do nothing... i.e. continue on rendering the setting
      } else {
        return null; // don't render the setting
      }
    }

    return (
      <ListItem onPress={() => navigation.navigate(item.nav)}>
        <Icon name={item.icon} type={item.icon_type} color={dark} />
        <ListItem.Content>
          <ListItem.Title style={styles.title}>{item.name}</ListItem.Title>
        </ListItem.Content>
        <Icon name="chevron-right" color={light} />
      </ListItem>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList data={settings_data} renderItem={renderSetting} />
      <View style={styles.app_info}>
        <Text>v{version}</Text>
      </View>
    </View>
  );
};

export default SettingsHome;

const styles = StyleSheet.create({
  app_info: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginHorizontal: 15,
    marginVertical: 10,
  },
  container: {
    flex: 1,
  },
  title: {
    color: dark,
  },
});
