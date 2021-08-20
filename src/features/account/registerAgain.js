import { green } from 'common/colors';
import { registerPlayer, validateName } from 'common/utils/account';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, Card } from 'react-native-elements';

const RegisterAgain = (props) => {
  const { fbUser, retryCreds } = props;

  const [registration, setRegistration] = useState({
    email: fbUser.email,
    name: '',
    short: '',
  });

  const [nameValid, setNameValid] = useState(false);
  const [shortValid, setShortValid] = useState(false);

  const validate = (type, text) => {
    const nTest = type === 'name' ? text : registration.name;
    const sTest = type === 'short' ? text : registration.short;

    setNameValid(validateName(nTest));
    setShortValid(validateName(sTest));
  };

  const nValid = { borderColor: nameValid ? green : '#ddd' };
  const sValid = { borderColor: shortValid ? green : '#ddd' };

  const register = async () => {
    await registerPlayer(registration, {
      email: fbUser.email,
      metadata: fbUser.metadata,
      providerData: fbUser.providerData,
      providerId: fbUser.providerId,
      uid: fbUser.uid,
    });

    retryCreds();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView>
        <ScrollView>
          <Card>
            <Card.Title>Registration Error</Card.Title>
            <Card.Divider />
            <Text style={styles.sorry}>
              We encountered an error during registration. How embarrassing for us. Can
              you please fill out the following fields again so we can try to fix this?
            </Text>
            <View style={styles.field_container}>
              <Text style={styles.field_label}>Email</Text>
              <Text style={styles.sorry}>{fbUser.email}</Text>
            </View>
            <View style={styles.field_container}>
              <Text style={styles.field_label}>Full Name *</Text>
              <TextInput
                style={[styles.field_input, nValid]}
                onChangeText={(text) => {
                  setRegistration({
                    ...registration,
                    name: text,
                  });
                  validate('name', text);
                }}
                autoCapitalize="words"
                value={registration.name}
              />
            </View>
            <View style={styles.field_container}>
              <Text style={styles.field_label}>Short/Nickname *</Text>
              <TextInput
                style={[styles.field_input, sValid]}
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
          </Card>
          <View style={styles.button_row}>
            <Button
              buttonStyle={styles.next}
              title="Fix Registration"
              type={nameValid && shortValid ? 'solid' : 'outline'}
              disabled={!(nameValid && shortValid)}
              onPress={() => {
                register();
              }}
              accessibilityLabel="Fix Registration"
              testID="register_again_button"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterAgain;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#b30000',
    flex: 1,
  },
  sorry: {
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
    justifyContent: 'flex-end',
    padding: 15,
  },
  next: {
    width: 200,
  },
});
