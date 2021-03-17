import React, { useContext, } from 'react';
import {
  FlatList,
  StyleSheet,
} from 'react-native';
import {
  ListItem,
} from 'react-native-elements';

import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { light } from 'common/colors';



const Account = props => {
  const {
    currentPlayer,
    setCurrentPlayer,
  } = useContext(CurrentPlayerContext);
  //console.log('currentPlayer', currentPlayer);

  const account_data = [
    {
      key: '0',
      name: 'Email',
      slug: 'email',
      value: currentPlayer.email,
    },
    {
      key: '1',
      name: 'Name',
      slug: 'name',
      value: currentPlayer.name,
    },
    {
      key: '2',
      name: 'Short/Nickname',
      slug: 'short',
      value: currentPlayer.short,
    },
  ];

  const renderAccountItem = ({item}) => {

    return (
      <ListItem
        onPress={() => console.log(item.slug)}
      >
        <ListItem.Content>
          <ListItem.Title style={styles.title}>{item.name}</ListItem.Title>
          <ListItem.Subtitle style={styles.subtitle}>{item.value}</ListItem.Subtitle>
        </ListItem.Content>
      </ListItem>
    );
  };

  return (
    <FlatList
      data={account_data}
      renderItem={renderAccountItem}
    />
  );
};

export default Account;


const styles = StyleSheet.create({
  title: {
    fontSize: 11,
    color: light,
  },
  subtitle: {
    marginTop: 3,
  },
});