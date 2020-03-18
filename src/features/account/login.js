import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import {
  Button,
  Card,
} from 'react-native-elements';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';

import { blue, green } from 'common/colors';
import { validateEmail, validatePassword } from 'common/utils/account';

const { width } = Dimensions.get('window')



const Login = props => {

  const [ email, setEmail ] = useState('');
  const [ password, setPassword ] = useState('');
  const [ emailValid, setEmailValid ] = useState(false);
  const [ passValid, setPassValid ] = useState(false);
  const [ loginError, setLoginError ] = useState();

  const navigation = useNavigation();
  const emailRef = useRef(null);

  const login = async () => {

    try {
      const res = await auth().signInWithEmailAndPassword(email, password);
    } catch( e ) {
      console.log('login error', e.message, e.code);
      const split = e.message.split(']');
      console.log('message', split);
      let message = e.message;
      if( split && split[1] ) message = split[1].trim();
      setLoginError(message);
    }

  };

  const validate = (type, text) => {

    const eTest = type == 'email' ? text : email;
    const pTest = type == 'password' ? text : password;

    setEmailValid(validateEmail(eTest));
    setPassValid(validatePassword(pTest));

  };

  const eValid = { borderColor: emailValid ? green : '#ddd' };
  const pValid = { borderColor: passValid ? green : '#ddd' };

  useEffect(
    () => {
      if( emailRef && emailRef.current ) {
        emailRef.current.focus();
      }
    }, [emailRef]
  );

  return (
    <Card
      title='Login'
      testID='login_form_view'
    >
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
        <View style={styles.field_container}>
          <Text style={styles.error_text}>{loginError}</Text>
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
    </Card>
  );

};

export default Login;


var styles = StyleSheet.create({
  loginView: {
    margin: 10,
    height: '100%',
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
