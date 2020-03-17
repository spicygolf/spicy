import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-community/async-storage';

import { baseUrl } from 'common/config';
import RegisterBasics from 'features/account/registerBasics';
import RegisterHandicap from 'features/account/registerHandicap';
import RegisterHandicapSearch from 'features/account/registerHandicapSearch';
import RegisterPlayer from 'features/account/registerPlayer';
import RegisterError from 'features/account/registerError';
import { blue } from 'common/colors';



const Register = props => {

  const defaultRegistration = {
    email: '',
    password: '',
    password2: '',
    lastName: '',
    ghinNumber: '',
    country: 'USA',
    state: '',
    ghin_creds: null,
    ghin_data: null,
    name: '',
    short: '',
    prev: 1,
  };

  const [ registration, setRegistration ] = useState(defaultRegistration);

  const navigation = useNavigation();

  const { route } = props;
  const c = (route && route.params && route.params.c) ? route.params.c : 1;
  const e = (route && route.params && route.params.e) ? route.params.e : {
    error: 500,
    message: 'Unknown error',
  };

  // TODO: use StackNav here?
  // TODO: useContext here, for the reg/setReg fns?
  const get_card = c => {
    switch( c ) {
      case 1:
        return (
          <RegisterBasics
            registration={registration}
            setRegistration={setRegistration}
          />
        );
        break;
      case 2:
        return (
          <RegisterHandicap
            registration={registration}
            setRegistration={setRegistration}
          />
        );
        break;
      case 3:
        return (
          <RegisterHandicapSearch
            registration={registration}
            setRegistration={setRegistration}
          />
        );
        break;
      case 4:
        return (
          <RegisterPlayer
            registration={registration}
            setRegistration={setRegistration}
          />
        );
        break;
      case 5:
        register();
        break;
      case 10000:
        // error screen
        return (
          <RegisterError
            registration={registration}
            setRegistration={setRegistration}
            error={e}
          />
        );
        break;
      default:
        break;
    }
  };

  const register = async () => {
    //console.log('registration', registration);

    // REST call to register player
    const uri = `${baseUrl}/account/register`;
    try {
      const res = await fetch(uri, {
        method: 'POST',
        body: JSON.stringify(registration),
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
      });
      const payload = await res.json();

      if( payload.statusCode == 201 ) {
        // successful registration and login
        await AsyncStorage.setItem('currentPlayer', payload.pkey);
        await AsyncStorage.setItem('token', payload.token);

        // clear fields after successful login
        //setRegistration(defaultRegistration);
        // TODO: this doesn't work, because it causes a re-render.
        //       need to figure out how to reset registration

        navigation.navigate('App', {
          currentPlayerKey: payload.pkey,
          token: payload.token,
        });
        return;
      }

      // handle anything other than 201 here.
      console.log('error payload', payload);
      navigation.navigate('Register', {c: 10000, e: payload});

    } catch(err) {
      console.log('err', err);
      navigation.navigate('Register', {c: 10000, e: {
        error: 500,
        message: err
      }});
    }
  };



  return (
    <View style={styles.container}>
      { get_card(c) }
      <View style={styles.login_view}>
        <Text>
          Already have an account?
          <Text
            onPress={() => { navigation.navigate('Login'); }}
            style={styles.login_text}
          >  Login</Text>
        </Text>
      </View>
    </View>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    margin: 10,
    height: '100%',
    justifyContent: 'space-between',
  },
  login_view: {
    padding: 15,
    paddingBottom: 40,
  },
  login_text: {
    fontWeight: 'bold',
    marginLeft: 6,
    color: blue,
  },
});
