import React, { useContext, useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import {
  Button,
  Card,
} from 'react-native-elements';
import { useApolloClient } from '@apollo/client';

import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { clearCache } from 'common/utils/account';



const Impersonate = props => {

  const client = useApolloClient();

  const {
    setCurrentPlayerKey,
  } = useContext(CurrentPlayerContext);

  const [iPlayer, setIPlayer] = useState(null);

  const impersonateUser = () => {
    console.log('impersonate', iPlayer);
    clearCache(client);
    setCurrentPlayerKey(iPlayer);
  };

  return (
    <KeyboardAvoidingView>
      <ScrollView keyboardShouldPersistTaps='handled'>
        <Card>
          <Text style={styles.field_label}>Player to Impersonate:</Text>
          <TextInput
            style={styles.field_input}
            onChangeText={text => setIPlayer(text)}
          />
          <Button
            title='Impersonate'
            buttonStyle={styles.button}
            onPress={() => impersonateUser()}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
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
    margin: 10,
  },
});