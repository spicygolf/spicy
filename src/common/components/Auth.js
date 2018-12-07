import React, { Component } from 'react';
import {
  AsyncStorage,
  Button,
  StyleSheet,
  Text,
  View
} from 'react-native';
import jwtDecode from 'jwt-decode';
import { withApollo } from 'react-apollo';
import t from 'tcomb-form-native';

import TabsContainer from 'features/tabs/TabsContainer';
import Header from 'common/components/header';
import { green } from 'common/colors';
import { baseUrl } from 'common/config';
import { GET_PLAYER_QUERY } from 'features/players/graphql';


const Form = t.form.Form;

const loginForm = t.struct({
  email: t.String,
  password: t.String
});


class Auth extends Component {

  constructor(props) {
    super(props);
    this.state = {
      show: 'Loading',
      values: {}
    };
    this._onChange = this._onChange.bind(this);
    this._onLogin = this._onLogin.bind(this);
  }

  async componentDidMount() {

    const token = await AsyncStorage.getItem('token');

    // if no token, render Login component
    if( !token ) {
      this.setState(prev => {
        prev.show = 'Login';
        return prev;
      });
      return;
    }

    // we have token, so get current player (from server or cache) and then
    // render TabsContainer
    const { pkey } = jwtDecode(token);
    await this.props.client.query({
      query: GET_PLAYER_QUERY,
      variables: {
        player: pkey
      }
    });

    // go to TabsContainer
    this.setState(prev => {
      prev.show = 'Tabs';
      return prev;
    });
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

      // go to TabsContainer
      this.setState(prev => {
        prev.show = 'Tabs';
        return prev;
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
      autoCapitalize: 'none'
    };

    let password = {
      label: 'Password', //I18n.t('LoginForm.password'),
      secureTextEntry: true,
      editable: true,
      hasError: false,
      error: '',
      autoCapitalize: 'none'
    };

    let title, content;

    switch ( this.state.show ) {
      case 'Tabs':
        return <TabsContainer />
        break;
      case 'Login':
        const options = {
          fields: {
            email: email,
            password: password
          }
        };
        title='Login';
        content = (
          <View style={styles.loginView}>
            <Form
              ref='form'
              type={loginForm}
              options={options}
              value={this.props.value}
              onChange={this._onChange}
              testId="login_form"
            />
            <Button
              style={styles.button}
              onPress={this._onLogin}
              title='Login'
              accessibilityLabel='Login'
            />
          </View>
        );
        break;
      default:
        title='Loading';
        content=(<Text>Loading...</Text>);
    };
    return (
      <View>
        <Header title={title} color={green}/>
        {content}
      </View>
    );
  }

}

export default withApollo(Auth);


var styles = StyleSheet.create({
  loginView: {
    margin: 10
  },
  button: {
    backgroundColor: '#FF3366',
    borderColor: '#FF3366'
  }

})
