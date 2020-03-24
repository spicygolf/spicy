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

import BackToLogin from 'features/account/backToLogin';
import { RegisterContext } from 'features/account/registerContext';
import { validateName } from 'common/utils/account';
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

  const changes = registration.ghin_creds ?
    'Make changes to GHIN information (if any)' : '';

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

        if( registration.ghin_creds ) {
          const search_results = await login(
            registration.ghin_creds.ghinNumber,
            registration.ghin_creds.lastName
          );
          if( search_results ) {
            setRegistration({
              ...registration,
              ghin_data: search_results
            });
          }
        }
      };
      fetchData();
    }, []
  );

  return (
    <View style={styles.container}>
      <View>
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
              navigation.navigate('RegisterComplete')
            }}
            accessibilityLabel='Register Next 4'
            testID='register_next_4_button'
          />
        </View>
      </View>
      <BackToLogin />
    </View>
  );
};

export default RegisterPlayer;


const styles = StyleSheet.create({
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