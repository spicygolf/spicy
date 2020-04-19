import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import {
  Button,
  Card,
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';

import { baseUrl } from 'common/config';
import { green } from 'common/colors';
import { validateEmail } from 'common/utils/account';



const Forgot = props => {

  const [ email, setEmail ] = useState('');
  const [ emailValid, setEmailValid ] = useState(false);

  const navigation = useNavigation();
  const emailRef = useRef(null);

  const forgot = async () => {
    // REST call to API to get email sent for password reset
    const uri = `${baseUrl}/account/forgot`;
    try {
      const res = await fetch(uri, {
        method: 'POST',
        body: JSON.stringify({
          email: email,
        }),
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
      });
      const payload = await res.json();
      console.log('forgot payload', payload);
      // TODO: handle anything other than 200 here.

      // clear fields after successful login
      setEmail('');
      setEmailValid(false);
      emailRef.current.focus();

      navigation.navigate('Login');

    } catch(err) {
      console.error(err);
      // TODO: handle me
    }
  };

  const validate = (type, text) => {

    const eTest = type == 'email' ? text : email;
    setEmailValid(validateEmail(eTest));

  };

  const eValid = { borderColor: emailValid ? green : '#ddd' };

  useEffect(
    () => {
      if( emailRef && emailRef.current ) {
        emailRef.current.focus();
      }
    }, [emailRef]
  );

  return (
    <View style={styles.container}>
      <Card
        title='Forgot Password'
        testID='forgot_form_view'
      >
        <View>
          <View style={styles.field_container}>
            <Text style={styles.field_label}>Email *</Text>
            <TextInput
              style={[styles.field_input, eValid]}
              onChangeText={text => {
                setEmail(text);
                validate('email', text);
              }}
              keyboardType='email-address'
              autoCapitalize='none'
              value={email}
              ref={emailRef}
            />
          </View>
          <Button
            style={styles.login_button}
            onPress={forgot}
            title='Submit'
            type={(emailValid) ? 'solid' : 'outline'}
            disabled={!(emailValid)}
            accessibilityLabel='Submit'
            testID='forgot_button'
          />
        </View>
      </Card>
      <View style={styles.back_to_login_view}>
        <Text style={styles.back_to_text}>
          Back to
          <Text
            onPress={() => navigation.navigate('Login')}
            style={styles.login_text}
          > Login</Text>
        </Text>
      </View>
    </View>
  );

};

export default Forgot;


var styles = StyleSheet.create({
  container: {
    backgroundColor: '#b30000',
    flex: 1,
  },
  loginView: {
    margin: 10,
    height: '100%',
  },
  field_container: {

  },
  field_label: {
    fontWeight: 'bold',
    margin: 5,
  },
  field_input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 10,
  },
  login_button: {
    marginTop: 15,
    marginBottom: 15,
  },
  back_to_text: {
    color: '#ccc',
  },
  back_to_login_view: {
    margin: 15,
    justifyContent: 'flex-start',
  },
  login_text: {
    fontWeight: 'bold',
    marginLeft: 6,
    color: '#fff',
  },
});
