import { useApolloClient } from '@apollo/client';
import { useMutation } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import GhinSearchPlayer from 'common/components/ghin/player/search';
import { logout } from 'common/utils/account';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { MERGE_PLAYERS_MUTATION } from 'features/players/graphql';
import React, { useContext, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card } from 'react-native-elements';

const LinkHandicap = (props) => {
  const defaultNewLink = {
    country: 'USA',
    state: '',
    lastName: '',
    firstName: '',
  };

  const { currentPlayer, setCurrentPlayer, setCurrentPlayerKey, setToken } =
    useContext(CurrentPlayerContext);

  const client = useApolloClient();
  const navigation = useNavigation();

  const [service, setService] = useState('ghin');
  const [newLink, setNewLink] = useState(defaultNewLink);

  const [mergePlayers] = useMutation(MERGE_PLAYERS_MUTATION);

  const linkHandicap = async () => {
    const { data } = await mergePlayers({
      variables: {
        source: {
          _key: currentPlayer._key,
        },
        target: {
          source: newLink.handicap.source,
          id: newLink.handicap.id,
        },
      },
    });
    if (data && data.mergePlayers) {
      // now logout
      setCurrentPlayer(null);
      setCurrentPlayerKey(null);
      setToken(null);
      logout(client);
    }
  };

  const serviceChooser = (
    <Text style={styles.ghin_only}>
      GHIN is the only handicap service currently supported.
    </Text>
  );
  /*  TODO: activate when we have more than one service
  const serviceChooser = (
    <Card>
      <Card.Title>Choose Service</Card.Title>
      <Card.Divider />
      <Button
        type='clear'
        title='GHIN'
        onPress={() => { setService('ghin');}}
      />
    </Card>
  );
*/

  let search = null;

  switch (service) {
    case 'ghin':
      search = (
        <Card wrapperStyle={styles.card_wrapper}>
          <Card.Title>GHIN Player Search</Card.Title>
          <Card.Divider />
          <GhinSearchPlayer state={newLink} setState={setNewLink} />
        </Card>
      );
      break;
    default:
      break;
  }

  if (newLink && newLink.handicap) {
    //console.log('newLink', newLink);
    return (
      <View style={styles.container}>
        <Card>
          <Card.Title>Confirm Link</Card.Title>
          <View style={styles.row}>
            <Text style={styles.label}>source</Text>
            <Text style={styles.value}>{newLink.handicap.source.toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>name</Text>
            <Text style={styles.value}>{newLink.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>number</Text>
            <Text style={styles.value}>{newLink.handicap.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>club</Text>
            <Text style={styles.value}>{newLink.club}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>handicap</Text>
            <Text style={styles.value}>{newLink.handicap.index}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>revision</Text>
            <Text style={styles.value}>{newLink.handicap.revDate}</Text>
          </View>
          <View style={styles.note_view}>
            <Text style={styles.note}>
              If you click 'Confirm' you will be logged out.
            </Text>
            <Text style={styles.note}>
              Login again and handicap service will be linked.
            </Text>
          </View>
        </Card>
        <View style={styles.button_row}>
          <Button
            style={styles.prev}
            title="Cancel"
            type="solid"
            onPress={() => {
              navigation.goBack();
            }}
            accessibilityLabel="Link Handicap Cancel"
          />
          <Button
            style={styles.next}
            title="Confirm"
            type="solid"
            onPress={() => {
              linkHandicap();
            }}
            accessibilityLabel="Link Handicap Confirm"
          />
        </View>
      </View>
    );
  } else {
    return (
      <View style={styles.container}>
        {serviceChooser}
        {search}
      </View>
    );
  }
};

export default LinkHandicap;

const styles = StyleSheet.create({
  container: {
    //flex: 1,
  },
  card_wrapper: {
    height: '96%',
  },
  ghin_only: {
    fontSize: 11,
    marginTop: 5,
    marginHorizontal: 18,
  },
  row: {
    flexDirection: 'row',
    marginVertical: 5,
    alignItems: 'baseline',
  },
  label: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  value: {
    //fontWeight: 'bold',
    flex: 4,
  },
  note_view: {
    marginTop: 25,
  },
  note: {
    textAlign: 'center',
    fontSize: 11,
  },
  button_row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  prev: {
    width: 150,
  },
  next: {
    width: 150,
  },
});
