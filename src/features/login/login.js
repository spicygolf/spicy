import React, { Component } from 'react';
import {
  Button,
  StyleSheet,
  Text,
  View
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import t from 'tcomb-form-native';

import { green } from 'common/colors';
import { baseUrl } from 'common/config';


const Form = t.form.Form;

const loginForm = t.struct({
  email: t.String,
  password: t.String
});


class Login extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: {}
    };
    this._onChange = this._onChange.bind(this);
    this._onLogin = this._onLogin.bind(this);
  }

  _onChange(value) {
    this.setState({value});
  }

  async _onLogin() {
    //console.log('login state', this.state.value);
    // REST call to API to get token and store it in AsyncStorage
    const uri = `${baseUrl}/account/login`;
    try {
      const res = await fetch(uri, {
        method: 'POST',
        body: JSON.stringify(this.state.value),
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

      this.props.navigation.navigate('App', {
        currentPlayerKey: payload.pkey,
        token: payload.token,
      });

    } catch(err) {
      console.error(err);
      // TODO: handle me
    }
  }

  render() {

    let email = {
      label: 'Email', //I18n.t('LoginForm.username'),
      editable: true,
      hasError: false,
      error: '',
      keyboardType: 'email-address',
      autoCapitalize: 'none',
      testID: 'email_field'
    };

    let password = {
      label: 'Password', //I18n.t('LoginForm.password'),
      secureTextEntry: true,
      editable: true,
      hasError: false,
      error: '',
      autoCapitalize: 'none',
      testID: 'password_field'
    };

    const options = {
      fields: {
        email: email,
        password: password
      }
    };

    const title='Login';
    return (
      <View style={styles.loginView} testID='login_form_view'>
        <Form
          ref='form'
          type={loginForm}
          options={options}
          value={this.state.value}
          onChange={this._onChange}
        />
        <Button
          style={styles.button}
          onPress={this._onLogin}
          title='Login'
          accessibilityLabel='Login'
          testID='login_button'
        />
      </View>
    );
  }

}

export default Login;


var styles = StyleSheet.create({
  loginView: {
    margin: 10
  },
  button: {
    backgroundColor: '#FF3366',
    borderColor: '#FF3366'
  }

})
