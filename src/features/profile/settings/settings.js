import React, { useContext, } from 'react';
import {
  FlatList,
  StyleSheet,
} from 'react-native';
import {
  Icon,
  ListItem,
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';

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
    <FlatList
      data={settings_data}
      renderItem={renderSetting}
    />
  );
};

export default SettingsHome;


const styles = StyleSheet.create({
  title: {
    color: dark,
  },
});