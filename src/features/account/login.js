import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
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

import { green } from 'common/colors';
import { validateEmail, validatePassword } from 'common/utils/account';



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

  return (
    <KeyboardAvoidingView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps='handled'>
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
        <Card testID='login_form_view'>
          <Card.Title>Login</Card.Title>
          <Card.Divider />
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
                testID='email_field'
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
                testID='password_field'
              />
            </View>
            <View style={styles.forgot_pwd_view}>
              <Button
                onPress={() => { navigation.navigate('Forgot'); }}
                title='FORGOT PASSWORD?'
                type='clear'
                titleStyle={styles.forgot_button_title}
                accessibilityLabel='Forgot Password?'
                testID='forgot_button'
              />
            </View>
            <View style={styles.field_container}>
              <Text style={styles.error_text}>{loginError}</Text>
            </View>
            <Button
              buttonStyle={styles.login_button}
              onPress={login}
              title='LOGIN'
              titleStyle={styles.login_button_title}
              type={(emailValid && passValid) ? 'solid' : 'outline'}
              disabled={!(emailValid && passValid)}
              accessibilityLabel='Login'
              testID='login_button'
            />
          </View>
        </Card>
        <View style={styles.register_view}>
          <Text style={styles.register_label}>Don't have an account?</Text>
          <Button
            onPress={() => { navigation.navigate('Register'); }}
            title='REGISTER'
            type='clear'
            titleStyle={styles.register_button_title}
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
  error_text: {
    color: 'red',
  },
  login_button: {
    marginVertical: 15,
  },
  login_button_title: {
    fontWeight: 'bold',
  },
  forgot_pwd_view: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  forgot_button_title: {
    //color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  register_view: {
    alignItems: 'center',
    marginTop: 25,
  },
  register_label: {
    color: '#ccc',
  },
  register_button_title: {
    color: '#ddd',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
