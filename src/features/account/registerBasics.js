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

import { RegisterContext } from 'features/account/registerContext';
import BackToLogin from 'features/account/backToLogin';
import { validateEmail, validatePassword } from 'common/utils/account';
import { green } from 'common/colors';




const RegisterBasics = props => {

  const { registration, setRegistration } = useContext(RegisterContext);
  const navigation = useNavigation();
  const emailRef = useRef(null);

  const [ emailValid, setEmailValid ] = useState(false);
  const [ passValid, setPassValid ] = useState(false);
  const [ pass2Valid, setPass2Valid ] = useState(false);

  const validate = (type, text) => {

    const eTest = type == 'email' ? text : registration.email;
    const pTest = type == 'password' ? text : registration.password;
    const p2Test = type == 'password2' ? text : registration.password2;

    setEmailValid(validateEmail(eTest));
    setPassValid(validatePassword(pTest) && (pTest == p2Test));
    setPass2Valid(validatePassword(p2Test) && (p2Test == pTest));
  };

  const eValid = { borderColor: emailValid ? green : '#ddd' };
  const pValid = { borderColor: passValid ? green : '#ddd' };
  const p2Valid = { borderColor: pass2Valid ? green : '#ddd' };

  useEffect(
    () => {
      if( emailRef && emailRef.current ) {
        emailRef.current.focus();
        validate();
      }
    }, [emailRef]
  );

  return (
    <View style={styles.container}>
      <View>
        <Card title='Register - Basics'>
          <View style={styles.loginView} testID='register_1_view'>
            <View>
              <View style={styles.field_container}>
                <Text style={styles.field_label}>Email *</Text>
                <TextInput
                  style={[styles.field_input, eValid]}
                  onChangeText={text => {
                    setRegistration({
                      ...registration,
                      email: text,
                    });
                    validate('email', text);
                  }}
                  keyboardType='email-address'
                  autoCapitalize='none'
                  value={registration.email}
                  ref={emailRef}
                />
              </View>
              <View style={styles.field_container}>
                <Text style={styles.field_label}>Password *</Text>
                <TextInput
                  style={[styles.field_input, pValid]}
                  onChangeText={text => {
                    setRegistration({
                      ...registration,
                      password: text,
                    });
                    validate('password', text);
                  }}
                  autoCompleteType='password'
                  secureTextEntry={true}
                  autoCapitalize='none'
                  value={registration.password}
                />
              </View>
              <View style={styles.field_container}>
                <Text style={styles.field_label}>Password Again *</Text>
                <TextInput
                  style={[styles.field_input, p2Valid]}
                  onChangeText={text => {
                    setRegistration({
                      ...registration,
                      password2: text,
                    });
                    validate('password2', text);
                  }}
                  autoCompleteType='password'
                  secureTextEntry={true}
                  autoCapitalize='none'
                  value={registration.password2}
                />
              </View>
            </View>
          </View>
        </Card>
        <View style={styles.button_row}>
          <Button
            style={styles.next}
            title='Next'
            type={(emailValid && passValid && pass2Valid) ? 'solid' : 'outline'}
            disabled={!(emailValid && passValid && pass2Valid)}
            onPress={() => {
              navigation.navigate('RegisterHandicap')
            }}
            accessibilityLabel='Register Next 1'
            testID='register_next_1_button'
          />
        </View>
      </View>
      <BackToLogin />
    </View>
  );
};

export default RegisterBasics;


const styles = StyleSheet.create({
  field_label: {
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 5,
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
  button_row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
  },
  next: {
    width: 150,
  },
});