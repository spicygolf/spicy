import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';

import RegisterBasics from 'features/account/registerBasics';
import RegisterHandicap from 'features/account/registerHandicap';
import RegisterHandicapSearch from 'features/account/registerHandicapSearch';
import RegisterPlayer from 'features/account/registerPlayer';
import RegisterError from 'features/account/registerError';
import { register } from 'common/utils/account';
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
    try {
      const res = await auth().createUserWithEmailAndPassword(
        registration.email,
        registration.password
      );
      if( res && res.user ) {
        res.user.sendEmailVerification();
        await register(registration, res.user);
      }
    } catch( e ) {
      //console.log('register error', e);
      let message = e.message;
      const split = e.message.split(']');
      if( split && split[1] ) message = split[1].trim();
      navigation.navigate('Register', {c: 10000, e: {
        error: 500,
        message: message
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
