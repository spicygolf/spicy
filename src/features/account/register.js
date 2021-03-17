import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

import { RegisterContext } from 'features/account/registerContext';
import RegisterBasics from 'features/account/registerBasics';
import RegisterHandicap from 'features/account/registerHandicap';
import RegisterPlayer from 'features/account/registerPlayer';
import RegisterError from 'features/account/registerError';



const Register = props => {

  const defaultRegistration = {
    email: '',
    password: '',
    password2: '',
    lastName: '',
    firstName: '',
    ghinNumber: '',
    country: 'USA',
    state: '',
    ghinCreds: null,
    ghinData: null,
    name: '',
    short: '',
  };

  const [ registration, setRegistration ] = useState(defaultRegistration);
  const Stack = createStackNavigator();

  return (
    <SafeAreaView style={styles.container}>
      <RegisterContext.Provider
        value={{
          registration: registration,
          setRegistration: setRegistration,
        }}
      >
        <Stack.Navigator
          initialRouteName='RegisterBasics'
          headerMode='none'
        >
          <Stack.Screen name='RegisterBasics' component={RegisterBasics} />
          <Stack.Screen name='RegisterHandicap' component={RegisterHandicap} />
          <Stack.Screen name='RegisterPlayer' component={RegisterPlayer} />
          <Stack.Screen name='RegisterError' component={RegisterError} />
        </Stack.Navigator>
      </RegisterContext.Provider>
    </SafeAreaView>
  );
};

export default Register;


const styles = StyleSheet.create({
  container: {
    backgroundColor: '#b30000',
    flex: 1,
  },
});
