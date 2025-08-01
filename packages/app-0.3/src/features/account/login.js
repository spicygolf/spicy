import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import {
  parseFirebaseError,
  validateEmail,
  validatePassword,
} from 'common/utils/account';
import React, { useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Card, Input } from 'react-native-elements';

const Login = (props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailValid, setEmailValid] = useState(true);
  const [passValid, setPassValid] = useState(true);
  const [loginError, setLoginError] = useState();

  const navigation = useNavigation();
  const emailRef = useRef(null);

  const logo = require('../../../assets/img/logo200.png');

  const login = async () => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (e) {
      console.log('login error', e.message, e.code);
      const { message } = parseFirebaseError(e);
      setLoginError(message);
    }
  };

  const validate = (type, text) => {
    const eTest = type === 'email' ? text : email;
    const pTest = type === 'password' ? text : password;

    setEmailValid(validateEmail(eTest));
    setPassValid(validatePassword(pTest));
  };

  return (
    <KeyboardAvoidingView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.logo_view}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.logo_view}>
          <Text style={styles.welcome}>Welcome to Spicy Golf</Text>
        </View>
        <Card testID="login_form_view">
          <View>
            <View style={styles.field}>
              <Input
                label="Email"
                labelStyle={styles.label}
                containerStyle={styles.field_input}
                inputStyle={styles.field_input_txt}
                errorMessage={emailValid ? '' : 'Please enter a valid email address'}
                onChangeText={(text) => {
                  setEmail(text);
                  validate('email', text);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                ref={emailRef}
                testID="email_field"
              />
            </View>
            <View style={styles.field}>
              <Input
                label="Password"
                labelStyle={styles.label}
                containerStyle={styles.field_input}
                inputStyle={styles.field_input_txt}
                errorMessage={passValid ? '' : 'Please enter a valid password'}
                onChangeText={(text) => {
                  setPassword(text);
                  validate('password', text);
                }}
                autoCompleteType="password"
                secureTextEntry={true}
                autoCapitalize="none"
                value={password}
                testID="password_field"
              />
            </View>
            <View style={styles.forgot_pwd_view}>
              <Button
                onPress={() => {
                  navigation.navigate('Forgot');
                }}
                title="FORGOT PASSWORD?"
                type="clear"
                titleStyle={styles.forgot_button_title}
                accessibilityLabel="Forgot Password?"
                testID="forgot_button"
              />
            </View>
            <View style={styles.field_container}>
              <Text style={styles.error_text}>{loginError}</Text>
            </View>
            <Button
              buttonStyle={styles.login_button}
              onPress={login}
              title="LOGIN"
              titleStyle={styles.login_button_title}
              type={emailValid && passValid ? 'solid' : 'outline'}
              disabled={!(emailValid && passValid)}
              accessibilityLabel="Login"
              testID="login_button"
            />
          </View>
        </Card>
        <View style={styles.register_view}>
          <Text style={styles.register_label}>Don't have an account?</Text>
          <Button
            onPress={() => {
              navigation.navigate('Register');
            }}
            title="REGISTER"
            type="clear"
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
  error_text: {
    color: 'red',
  },
  field: {
    flex: 1,
    marginBottom: 5,
  },
  field_input: {
    color: '#000',
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  forgot_button_title: {
    //color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  forgot_pwd_view: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  label: {
    color: '#999',
    fontSize: 12,
    fontWeight: 'normal',
  },
  loginView: {
    height: '100%',
    margin: 10,
  },
  login_button: {
    marginVertical: 15,
  },
  login_button_title: {
    fontWeight: 'bold',
  },
  logo: {
    height: 100,
  },
  logo_view: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 7,
  },
  register_button_title: {
    color: '#ddd',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  register_label: {
    color: '#ccc',
  },
  register_view: {
    alignItems: 'center',
    marginTop: 25,
  },
  welcome: {
    color: '#ddd',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
