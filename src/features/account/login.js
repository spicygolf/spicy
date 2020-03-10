import React, { useRef, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import {
  Button,
} from 'react-native-elements';
import AsyncStorage from '@react-native-community/async-storage';
import { useNavigation } from '@react-navigation/native';

import { baseUrl } from 'common/config';
import { blue, green } from 'common/colors';

const { width } = Dimensions.get('window')



const Login = props => {

  const [ email, setEmail ] = useState('');
  const [ password, setPassword ] = useState('');
  const [ emailValid, setEmailValid ] = useState(false);
  const [ passValid, setPassValid ] = useState(false);

  const navigation = useNavigation();
  const emailRef = useRef(null);

  const login = async () => {
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
      setEmailValid(false);
      setPassword('');
      setPassValid(false);
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

  const validate = (type, text) => {

    const eTest = type == 'email' ? text : email;
    const pTest = type == 'password' ? text : password;
    //console.log('email', eTest);
    //console.log('pass ', pTest);

    setEmailValid(validateEmail(eTest));
    setPassValid(validatePassword(pTest));

  };

  const validateEmail = email => {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePassword = pass => {
    if( pass.length > 3 ) return true;
  }

  const eValid = { borderColor: emailValid ? green : '#ddd' };
  const pValid = { borderColor: passValid ? green : '#ddd' };

  return (
    <View style={styles.loginView} testID='login_form_view'>
      <View>
        <View style={styles.field_container}>
          <Text style={styles.field_label}>Email</Text>
          <TextInput
            style={[styles.field_input, eValid]}
            onChangeText={text => {
              setEmail(text);
              validate('email', text);
            }}
            keyboardType='email-address'
            autoCapitalize='none'
            value={email}
            ref={emailRef}
          />
        </View>
        <View style={styles.field_container}>
        <Text style={styles.field_label}>Password</Text>
          <TextInput
            style={[styles.field_input, pValid]}
            onChangeText={text => {
              setPassword(text);
              validate('password', text);
            }}
            autoCompleteType='password'
            secureTextEntry={true}
            autoCapitalize='none'
            value={password}
          />
        </View>
        <Button
          style={styles.login_button}
          onPress={login}
          title='Login'
          type={(emailValid && passValid) ? 'solid' : 'outline'}
          disabled={!(emailValid && passValid)}
          accessibilityLabel='Login'
          testID='login_button'
        />
        <Button
          onPress={() => { navigation.navigate('Forgot'); }}
          title='Forgot Password'
          type='clear'
          accessibilityLabel='Forgot Password'
          testID='forgot_button'
        />
      </View>
      <View style={styles.divider}>
        <View style={styles.hrLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.hrLine} />
      </View>
      <View style={styles.new_account_view}>
        <Button
          onPress={() => { navigation.navigate('Register'); }}
          title='Register A New Account'
          type='clear'
        />
      </View>
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
  login_button: {
    marginTop: 15,
    marginBottom: 15,
  },
  divider: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  hrLine: {
    width: width / 3.5,
    backgroundColor: blue,
    height: 1,
  },
  dividerText: {
    color: blue,
    textAlign: 'center',
    width: width / 8,
  },
  new_account_view: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
