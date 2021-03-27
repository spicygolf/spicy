import React, { useState, } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Input,
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';

import { parseFirebaseError, validate } from 'common/utils/account';
import { light, red } from 'common/colors';



const AccountChange = props => {

  const { route } = props;

  const navigation = useNavigation();

  const {
    name,
    value,
    type,
    errorMessage,
    keyboard,
    autoCap,
    update
  } = route.params;

  const [ newValue, setNewValue ] = useState(value);
  const [ valid, setValid ] = useState(true);
  const [ errorText, setErrorText ] = useState(errorMessage);
  const [ showPassword, setShowPassword ] = useState(false);
  const [ password, setPassword ] = useState();
  const [ loginError, setLoginError ] = useState();

  const passwordContent = showPassword
    ? (
      <View style={styles.auth_view}>
        <Text style={[styles.auth_txt, styles.auth_note]}>
          This change is sensitive, and requires a recent login.  Please enter
          your password to update.
        </Text>
        <Text style={[styles.auth_txt, styles.label]}>{name}</Text>
        <Text style={[styles.auth_txt, ]}>{value}</Text>
        <Input
          label='Password'
          labelStyle={styles.label}
          errorMessage={loginError ? loginError : ''}
          onChangeText={text => {
            setPassword(text);
          }}
          autoCompleteType='password'
          secureTextEntry={true}
          autoCapitalize='none'
          value={password}
        />
      </View>
    )
    : null;

  return (
    <Card>
      <Input
        label={name}
        labelStyle={styles.label}
        errorMessage={valid ? '' : errorText}
        onChangeText={text => {
          setNewValue(text);
          setValid(validate(type, text));
        }}
        keyboardType={keyboard || 'default'}
        autoCapitalize={autoCap || 'sentences'}
        value={newValue}
      />
      <Button
        title='Update'
        buttonStyle={styles.button}
        onPress={async () => {
          if( showPassword && password ) {
            try {
              const res = await auth().signInWithEmailAndPassword(value, password);
            } catch( e ) {
              console.log('login error', e.message, e.code);
              const { message: loginMessage } = parseFirebaseError(e);
              setLoginError(loginMessage);
            }
          }
          const { success, slug, message } = await update(newValue);
          if( success ) {
            navigation.navigate("Account");
          } else {
            //console.log(slug, message);
            if( slug == 'auth/requires-recent-login' ) {
              //console.log('need recent login to change email');
              setShowPassword(true);
            } else {
              console.log('error changing email: ', message);
              setValid(false);
              setErrorText(message);
            }
          }
        }}
      />
      { passwordContent }
    </Card>
  );
};

export default AccountChange;


const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: 'normal',
    color: light,
  },
  button: {
    margin: 10,
  },
  auth_view: {
    marginVertical: 15,
  },
  auth_txt: {
    marginHorizontal: 10,
    marginBottom: 15,
  },
  auth_note: {
    color: red,
  },
});