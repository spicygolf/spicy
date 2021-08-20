import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { validateEmail } from 'common/utils/account';
import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Input } from 'react-native-elements';

const Forgot = (props) => {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [emailValid, setEmailValid] = useState(true);

  const navigation = useNavigation();
  const emailRef = useRef(null);

  const forgot = async () => {
    try {
      await auth().sendPasswordResetEmail(email);

      setSent(true);
      // clear fields after successful login
      setEmail('');
      setEmailValid(false);
      emailRef.current.focus();
    } catch (e) {
      console.log('forgot error', e.message, e.code);
    }
  };

  const validate = (type, text) => {
    const eTest = type === 'email' ? text : email;
    setEmailValid(validateEmail(eTest));
  };

  useEffect(() => {
    if (emailRef && emailRef.current) {
      emailRef.current.focus();
    }
  }, [emailRef]);

  const button = (
    <Button
      style={styles.login_button}
      onPress={forgot}
      title="Send Password Reset Email"
      type={emailValid ? 'solid' : 'outline'}
      disabled={!emailValid}
      accessibilityLabel="Send Password Reset Email"
      testID="forgot_button"
    />
  );

  const sentMessage = <Text>Password Reset Email Sent</Text>;

  return (
    <KeyboardAvoidingView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.back_to_login_view}>
          <Text style={styles.back_to_text}>
            Back to
            <Text onPress={() => navigation.navigate('Login')} style={styles.login_text}>
              {' '}
              Login
            </Text>
          </Text>
        </View>
        <Card testID="forgot_form_view">
          <Card.Title>Forgot Password</Card.Title>
          <Card.Divider />
          <View>
            <View style={styles.field}>
              <Input
                label="Email"
                labelStyle={styles.label}
                containerStyle={styles.field_input}
                inputStyle={styles.field_input_txt}
                errorMessage={emailValid ? '' : 'Please enter a valid email address'}
                onChangeText={(text) => {
                  setEmail(text);
                  validate('email', text);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                ref={emailRef}
              />
            </View>
            {sent ? sentMessage : button}
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
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
