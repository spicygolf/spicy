import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Button,
  Card,
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import BackToLogin from 'features/account/backToLogin';
import { RegisterContext } from 'features/account/registerContext';
import { validateName, registerPlayer } from 'common/utils/account';
import { login } from 'common/utils/ghin';
import { green } from 'common/colors';




const RegisterPlayer = props => {

  const { registration, setRegistration } = useContext(RegisterContext);
  const navigation = useNavigation();
  const nameRef = useRef(null);

  const [ nameValid, setNameValid ] = useState(false);
  const [ shortValid, setShortValid ] = useState(false);

  const validate = (type, text) => {

    const nTest = type == 'name' ? text : registration.name;
    const sTest = type == 'short' ? text : registration.short;

    setNameValid(validateName(nTest));
    setShortValid(validateName(sTest));
  };

  const nValid = { borderColor: nameValid ? green : '#ddd' };
  const sValid = { borderColor: shortValid ? green : '#ddd' };

  const changes = registration.handicap ?
    'Make changes to GHIN information (if any)' : '';

  const register = async () => {
    //console.log('registration', JSON.stringify(registration, null, ' '));

    try {
      // firebase registration
      const res = await auth().createUserWithEmailAndPassword(
        registration.email,
        registration.password
      );

      if( res && res.user ) {
        //console.log('res.user', res.user);
        res.user.sendEmailVerification();
        // spicy golf registration
        const payload = await registerPlayer(registration, {
          email: res.user.email,
          metadata: res.user.metadata,
          providerData: res.user.providerData,
          providerId: res.user.providerId,
          uid: res.user.uid,
        });

        // TODO: trap errors here, add retry or something, not sure...

      } else {
        console.log('register error', res);
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
      if( nameRef && nameRef.current ) {
        nameRef.current.focus();
        validate();
      }
    }, [nameRef]
  );

  useEffect(
    () => {
      const fetchData = async () => {

        if( registration.ghinCreds ) {
          const search_results = await login(
            registration.ghinCreds.ghinNumber,
            registration.ghinCreds.lastName
          );
          if( search_results && search_results.length ) {
            const g = search_results[0];
            setRegistration({
              ...registration,
              handicap: {
                source: 'ghin',
                id: g.GHINNumber,
                firstName: g.FirstName,
                lastName: g.LastName,
                playerName: `${g.FirstName} ${g.LastName}`,
                gender: g.Gender,
                active: g.Active == 'true',
                index: g.Display,
                revDate: g.RevDate,
              },
              ghinData: search_results
            });
          }
        }
      };
      fetchData();
    }, []
  );

  return (
    <View style={styles.container}>
      <BackToLogin />
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps='handled'
      >
        <Card title='Register - Player Information'>
          <View testID='register_4_view'>
            <Text style={styles.changes}>{ changes }</Text>
            <View style={styles.field_container}>
              <Text style={styles.field_label}>Full Name *</Text>
              <TextInput
                style={[styles.field_input, nValid]}
                onChangeText={text => {
                  setRegistration({
                    ...registration,
                    name: text,
                  });
                  validate('name', text);
                }}
                autoCapitalize='words'
                value={registration.name}
                ref={nameRef}
              />
            </View>
            <View style={styles.field_container}>
              <Text style={styles.field_label}>Short/Nickname *</Text>
              <TextInput
                style={[styles.field_input, sValid]}
                onChangeText={text => {
                  setRegistration({
                    ...registration,
                    short: text,
                  });
                  validate('short', text);
                }}
                autoCapitalize='words'
                value={registration.short}
              />
            </View>
          </View>
        </Card>
        <View style={styles.button_row}>
          <Button
            style={styles.prev}
            title='Prev'
            type='solid'
            onPress={() => {
              navigation.goBack();
            }}
            accessibilityLabel='Register Prev 4'
            testID='register_prev_4_button'
          />
          <Button
            style={styles.next}
            title='Register'
            type={(nameValid && shortValid) ? 'solid' : 'outline'}
            disabled={!(nameValid && shortValid)}
            onPress={() => {
              register();
            }}
            accessibilityLabel='Register Next 4'
            testID='register_next_4_button'
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default RegisterPlayer;


const styles = StyleSheet.create({
  container: {
    backgroundColor: '#b30000',
    flex: 1,
  },
  changes: {
    paddingBottom: 20,
  },
  field_label: {
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 5,
  },
  field_input: {
    height: 40,
    color: '#000',
    borderColor: '#ccc',
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 10,
  },
  button_row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  prev: {
    width: 150,
  },
  next: {
    width: 150,
  },
});