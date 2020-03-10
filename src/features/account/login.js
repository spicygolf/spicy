import React, { useRef, useState } from 'react';
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import { useNavigation } from '@react-navigation/native';

import { baseUrl } from 'common/config';



const Login = props => {

  const [ email, setEmail ] = useState('');
  const [ password, setPassword ] = useState('');
  const navigation = useNavigation();
  const emailRef = useRef(null);

  const _onLogin = async () => {
    // REST call to API to get token and store it in AsyncStorage
    const uri = `${baseUrl}/account/login`;
    try {
      const res = await fetch(uri, {
        method: 'POST',
        body: JSON.stringify({
          email: email,
          password: password,
        }),
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
      });
      const payload = await res.json();
      console.log('payload', payload);
      // TODO: handle anything other than 200 here.
      await AsyncStorage.setItem('currentPlayer', payload.pkey);
      await AsyncStorage.setItem('token', payload.token);

      // clear fields after successful login
      setEmail('');
      setPassword('');
      emailRef.current.focus();

      navigation.navigate('App', {
        currentPlayerKey: payload.pkey,
        token: payload.token,
      });

    } catch(err) {
      console.error(err);
      // TODO: handle me
    }
  };

  return (
    <View style={styles.loginView} testID='login_form_view'>
      <View>
        <View style={styles.field_container}>
          <Text style={styles.field_label}>Email</Text>
          <TextInput
            style={styles.field_input}
            onChangeText={text => setEmail(text)}
            keyboardType='email-address'
            autoCapitalize='none'
            value={email}
            ref={emailRef}
          />
        </View>
        <View style={styles.field_container}>
        <Text style={styles.field_label}>Password</Text>
          <TextInput
            style={styles.field_input}
            onChangeText={text => setPassword(text)}
            autoCompleteType='password'
            secureTextEntry={true}
            autoCapitalize='none'
            value={password}
          />
        </View>
      </View>
      <Button
        style={styles.button}
        onPress={_onLogin}
        title='Login'
        accessibilityLabel='Login'
        testID='login_button'
      />
    </View>
  );

};

export default Login;


var styles = StyleSheet.create({
  loginView: {
    margin: 10
  },
  field_container: {

  },
  field_label: {
    fontWeight: 'bold',
    margin: 5,
  },
  field_input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#FF3366',
    borderColor: '#FF3366'
  }

});
