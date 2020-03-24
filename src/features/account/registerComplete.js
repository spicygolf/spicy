import React, { useContext, useEffect } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  Text,
} from 'react-native';
import {
  Card
} from 'react-native-elements';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';

import { RegisterContext } from 'features/account/registerContext';
import BackToLogin from 'features/account/backToLogin';
import { register_player } from 'common/utils/account';



const RegisterComplete = props => {

  const { registration } = useContext(RegisterContext);
  const navigation = useNavigation();

  const register = async () => {
    //console.log('registration', registration);
    try {
      const res = await auth().createUserWithEmailAndPassword(
        registration.email,
        registration.password
      );
      if( res && res.user ) {
        res.user.sendEmailVerification();
        await register_player(registration, res.user);
      }
    } catch( e ) {
      //console.log('register error', e);
      let message = e.message;
      const split = e.message.split(']');
      if( split && split[1] ) message = split[1].trim();
      navigation.navigate('RegisterError', {e: {
        error: 500,
        message: message
      }});

    }

  };

  useEffect(
    () => {
      register();
    }, []
  )

  return (
    <SafeAreaView>
      <Card title='Registering'>
        <ActivityIndicator />
      </Card>
      <BackToLogin />
    </SafeAreaView>
  );

};

export default RegisterComplete;
