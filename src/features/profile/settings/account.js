import { useMutation } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import { light } from 'common/colors';
import { parseFirebaseError } from 'common/utils/account';
import { omitTypename } from 'common/utils/game';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { UPDATE_PLAYER_MUTATION } from 'features/players/graphql';
import React, { useContext } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { ListItem } from 'react-native-elements';

const Account = (props) => {
  const { currentPlayer, setCurrentPlayer, user } = useContext(CurrentPlayerContext);
  //console.log('currentPlayer', currentPlayer);

  const [mutatePlayer] = useMutation(UPDATE_PLAYER_MUTATION);

  const navigation = useNavigation();

  const updatePlayer = async ({ field, newValue }) => {
    let newPlayer = {
      ...currentPlayer,
    };
    delete newPlayer.clubs;
    delete newPlayer.handicap;
    newPlayer[field] = newValue.trim();
    newPlayer = omitTypename(newPlayer);
    const { loading, error, data } = await mutatePlayer({
      variables: {
        player: newPlayer,
      },
    });
    //console.log('mutatePlayer', loading, error, data);
    if (!error && data && data.updatePlayer) {
      await setCurrentPlayer(data.updatePlayer);
      return { success: true };
    }
    return { success: false };
  };

  const account_data = [
    {
      key: '0',
      name: 'Email',
      slug: 'email',
      value: currentPlayer.email,
      type: 'email',
      keyboard: 'email-address',
      autoCap: 'none',
      errorMessage: 'Please enter a valid email address',
      update: async (newValue) => {
        //console.log('update email to: ', newValue);
        try {
          await user.updateEmail(newValue.trim());
          return updatePlayer({ field: 'email', newValue });
        } catch (e) {
          const { slug, message } = parseFirebaseError(e);
          return {
            success: false,
            slug,
            message,
          };
        }
      },
    },
    {
      key: '1',
      name: 'Name',
      slug: 'name',
      value: currentPlayer.name,
      type: 'name',
      autoCap: 'words',
      errorMessage: 'Please enter a valid name',
      update: async (newValue) => {
        //console.log('update name to: ', newValue);
        return updatePlayer({ field: 'name', newValue });
      },
    },
    {
      key: '2',
      name: 'Short/Nickname',
      slug: 'short',
      value: currentPlayer.short,
      type: 'name',
      autoCap: 'words',
      errorMessage: 'Please enter a valid short/nickname',
      update: async (newValue) => {
        //console.log('update short to: ', newValue);
        return updatePlayer({ field: 'short', newValue });
      },
    },
  ];

  const renderAccountItem = ({ item }) => {
    return (
      <ListItem
        onPress={async () => {
          navigation.navigate('AccountChange', item);
        }}
      >
        <ListItem.Content>
          <ListItem.Title style={styles.title}>{item.name}</ListItem.Title>
          <ListItem.Subtitle style={styles.subtitle}>{item.value}</ListItem.Subtitle>
        </ListItem.Content>
      </ListItem>
    );
  };

  return <FlatList data={account_data} renderItem={renderAccountItem} />;
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
