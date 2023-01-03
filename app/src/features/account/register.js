import { createStackNavigator } from '@react-navigation/stack';
import RegisterBasics from 'features/account/registerBasics';
import { RegisterContext } from 'features/account/registerContext';
import RegisterError from 'features/account/registerError';
import RegisterHandicap from 'features/account/registerHandicap';
import RegisterPlayer from 'features/account/registerPlayer';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

const Register = (props) => {
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

  const [registration, setRegistration] = useState(defaultRegistration);
  const Stack = createStackNavigator();

  return (
    <SafeAreaView style={styles.container}>
      <RegisterContext.Provider
        value={{
          registration: registration,
          setRegistration: setRegistration,
        }}
      >
        <Stack.Navigator initialRouteName="RegisterBasics" headerMode="none">
          <Stack.Screen name="RegisterBasics" component={RegisterBasics} />
          <Stack.Screen name="RegisterHandicap" component={RegisterHandicap} />
          <Stack.Screen name="RegisterPlayer" component={RegisterPlayer} />
          <Stack.Screen name="RegisterError" component={RegisterError} />
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
