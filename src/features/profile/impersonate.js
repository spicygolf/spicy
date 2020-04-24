import React, { useContext, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import {
  Button,
  Card,
} from 'react-native-elements';

import { CurrentPlayerContext } from 'features/players/currentPlayerContext';



const Impersonate = props => {

  const {
    setCurrentPlayerKey,
  } = useContext(CurrentPlayerContext);

  const [iPlayer, setIPlayer] = useState(null);

  const impersonateUser = () => {
    console.log('impersonate', iPlayer);
    setCurrentPlayerKey(iPlayer);
  };

  return (
    <Card title='Admin'>
      <Text style={styles.field_label}>Player to Impersonate:</Text>
      <TextInput
        style={styles.field_input}
        onChangeText={text => setIPlayer(text)}
      />
      <Button
        title='Impersonate'
        style={styles.button}
        onPress={() => impersonateUser()}
      />
    </Card>
  );
};

export default Impersonate;


const styles = StyleSheet.create({
  field_label: {
    fontWeight: 'bold',
    margin: 5,
  },
  field_input: {
    height: 40,
    color: '#000',
    borderColor: '#ccc',
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 10,
  },
  button: {
    margin: 20
  },
});