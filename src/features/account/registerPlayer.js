import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { registerPlayer, validateName } from 'common/utils/account';
import { login } from 'common/utils/ghin';
import BackToLogin from 'features/account/backToLogin';
import { RegisterContext } from 'features/account/registerContext';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Input } from 'react-native-elements';

const RegisterPlayer = (props) => {
  const { registration, setRegistration } = useContext(RegisterContext);
  const navigation = useNavigation();
  const nameRef = useRef(null);

  const [nameValid, setNameValid] = useState(false);
  const [shortValid, setShortValid] = useState(false);

  const validate = (type, text) => {
    const nTest = type == 'name' ? text : registration.name;
    const sTest = type == 'short' ? text : registration.short;

    setNameValid(validateName(nTest));
    setShortValid(validateName(sTest));
  };

  const changes = registration.handicap
    ? 'Make changes to GHIN information (if any)'
    : '';

  const register = async () => {
    //console.log('registration', JSON.stringify(registration, null, ' '));

    try {
      // firebase registration
      const res = await auth().createUserWithEmailAndPassword(
        registration.email,
        registration.password,
      );

      if (res && res.user) {
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
    } catch (e) {
      //console.log('register error', e);
      let message = e.message;
      const split = e.message.split(']');
      if (split && split[1]) message = split[1].trim();
      navigation.navigate('RegisterError', {
        e: {
          error: 500,
          message: message,
        },
      });
    }
  };

  useEffect(() => {
    if (nameRef && nameRef.current) {
      nameRef.current.focus();
      validate();
    }
  }, [nameRef]);

  useEffect(() => {
    const fetchData = async () => {
      if (registration.ghinCreds) {
        const search_results = await login(registration.ghinCreds);
        if (search_results && search_results.length) {
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
            ghinData: search_results,
          });
        }
      }
    };
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <BackToLogin />
      <KeyboardAvoidingView>
        <ScrollView keyboardShouldPersistTaps="handled">
          <Card>
            <Card.Title>Register - Player Information</Card.Title>
            <Card.Divider />
            <View testID="register_4_view">
              <Text style={styles.changes}>{changes}</Text>
              <View style={styles.field}>
                <Input
                  label="Full Name"
                  labelStyle={styles.label}
                  containerStyle={styles.field_input}
                  inputStyle={styles.field_input_txt}
                  errorMessage={nameValid ? '' : 'Please enter your full name'}
                  onChangeText={(text) => {
                    setRegistration({
                      ...registration,
                      name: text,
                    });
                    validate('name', text);
                  }}
                  autoCapitalize="words"
                  value={registration.name}
                  ref={nameRef}
                />
              </View>
              <View style={styles.field}>
                <Input
                  label="Short/Nickname"
                  labelStyle={styles.label}
                  containerStyle={styles.field_input}
                  inputStyle={styles.field_input_txt}
                  errorMessage={shortValid ? '' : 'Please enter your short/nickname'}
                  onChangeText={(text) => {
                    setRegistration({
                      ...registration,
                      short: text,
                    });
                    validate('short', text);
                  }}
                  autoCapitalize="words"
                  value={registration.short}
                />
              </View>
            </View>
          </Card>
          <View style={styles.button_row}>
            <Button
              style={styles.prev}
              title="Prev"
              type="solid"
              onPress={() => {
                navigation.goBack();
              }}
              accessibilityLabel="Register Prev 4"
              testID="register_prev_4_button"
            />
            <Button
              style={styles.next}
              title="Register"
              type={nameValid && shortValid ? 'solid' : 'outline'}
              disabled={!(nameValid && shortValid)}
              onPress={() => {
                register();
              }}
              accessibilityLabel="Register Next 4"
              testID="register_next_4_button"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  field: {
    flex: 1,
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    color: '#999',
    fontWeight: 'normal',
  },
  field_input: {
    color: '#000',
    marginHorizontal: 0,
    paddingHorizontal: 0,
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
