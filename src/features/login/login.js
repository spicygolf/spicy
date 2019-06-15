import React, { Component } from 'react';
import {
  Button,
  StyleSheet,
  Text,
  View
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import t from 'tcomb-form-native';

import Header from 'common/components/header';
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
      values: {}
    };
    this._onChange = this._onChange.bind(this);
    this._onLogin = this._onLogin.bind(this);
  }

  _onChange(values) {
    const k = Object.keys(values)[0];
    this.setState(prev => {
      prev.values[k] = values[k];
      return prev;
    });
  }

  async _onLogin() {
    // REST call to API to get token and store it in AsyncStorage
    const uri = `${baseUrl}/account/login`;
    try {
      const res = await fetch(uri, {
        method: 'POST',
        body: JSON.stringify(this.state.values),
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
      });
      const payload = await res.json();
      await AsyncStorage.setItem('currentPlayer', payload.pkey);
      await AsyncStorage.setItem('token', payload.token);

      this.props.navigation.navigate('App');

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
    const content = (
      <View style={styles.loginView} testID='login_form_view'>
        <Form
          ref='form'
          type={loginForm}
          options={options}
          value={this.props.value}
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

    return (
      <View>
        <Header title={title} color={green}/>
        {content}
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
