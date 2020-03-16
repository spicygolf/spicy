import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import RegisterBasics from 'features/account/registerBasics';
import RegisterHandicap from 'features/account/registerHandicap';
import RegisterHandicapSearch from 'features/account/registerHandicapSearch';
import RegisterPlayer from 'features/account/registerPlayer';
import { blue } from 'common/colors';



const Register = props => {

  const [ registration, setRegistration ] = useState({
    email: 'ba@ba.com',
    password: 'asdf',
    password2: 'asdf',
    lastName: 'Barrett',
    ghinNumber: '753836',
    country: 'USA',
    state: '',
    ghin_creds: null,
    ghin_data: null,
    name: '',
    short: '',
    prev: 1,
  });

  const navigation = useNavigation();

  const { route } = props;
  const c = (route && route.params && route.params.c) ? route.params.c : 1;

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
      default:
        console.log('registration', registration);
        break;
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
          >  Log In</Text>
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
