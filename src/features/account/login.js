import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

  const logo = require('../../../assets/img/logo200.png');

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
/*
  useEffect(
    () => {
      if( emailRef && emailRef.current ) {
        emailRef.current.focus();
      }
    }, [emailRef]
  );
*/
  return (
    <KeyboardAvoidingView
      behavior={"position"}
      style={styles.container}
      contentContainerStyle={{flex: 1,}}
    >
      <ScrollView>
        <View style={styles.logo_view}>
          <Image
            source={logo}
            style={styles.logo}
            resizeMode='contain'
          />
        </View>
        <View style={styles.logo_view}>
          <Text style={styles.welcome}>Welcome to Spicy Golf</Text>
        </View>
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
          </View>
        </Card>
        <View style={styles.non_login_buttons_view}>
          <Button
            onPress={() => { navigation.navigate('Forgot'); }}
            title='Forgot Password'
            type='clear'
            titleStyle={styles.non_login_buttons}
            accessibilityLabel='Forgot Password'
            testID='forgot_button'
          />
          <Button
            onPress={() => { navigation.navigate('Register'); }}
            title='Register'
            type='clear'
            titleStyle={styles.non_login_buttons}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

};

export default Login;


var styles = StyleSheet.create({
  container: {
    backgroundColor: '#b30000',
    flex: 1,
  },
  logo_view: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  logo: {
    height: 100,
  },
  welcome: {
    color: '#ddd',
    fontSize: 20,
    fontWeight: 'bold',
  },
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
    color: '#000',
    borderColor: '#ccc',
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 10,
  },
  login_button: {
    marginBottom: 15,
  },
  non_login_buttons_view: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 10,
  },
  non_login_buttons: {
    color: '#ddd',
  }
});
