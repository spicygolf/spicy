import React, { useContext, } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Icon,
  ListItem,
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';

import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { dark, light } from 'common/colors';



const SettingsHome = props => {

  const {
    currentPlayer,
  } = useContext(CurrentPlayerContext);

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

  const renderSetting = ({item}) => {
    if( item.level == 'admin' &&
        !(currentPlayer && currentPlayer.level && currentPlayer.level == 'admin') ) {
      return null;
    }

    return (
      <ListItem
        onPress={() => navigation.navigate(item.nav)}
      >
        <Icon
          name={item.icon}
          type={item.icon_type}
          color={dark}
        />
        <ListItem.Content>
          <ListItem.Title style={styles.title}>{item.name}</ListItem.Title>
        </ListItem.Content>
        <Icon
          name='chevron-right'
          color={light}
        />
      </ListItem>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={settings_data}
        renderItem={renderSetting}
      />
      <View style={styles.app_info}>
        <Text>v{version}</Text>
      </View>
    </View>
  );
};

export default SettingsHome;


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    color: dark,
  },
  app_info: {
    marginHorizontal: 15,
    marginVertical: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});