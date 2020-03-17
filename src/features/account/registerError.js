import React, { useEffect, useRef, useState } from 'react';
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



const RegisterError = props => {

  const { registration, setRegistration, error } = props;
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View>
        <Card title='Register - Error'>
          <View testID='register_10000_view'>
            <Text>{error.message}</Text>
          </View>
        </Card>
        <View style={styles.button_row}>
          <Button
            style={styles.prev}
            title='Prev'
            type='solid'
            onPress={() => {
              setRegistration({
                ...registration,
                prev: 4,
              });
              navigation.navigate('Register', {c: registration.prev});
            }}
            accessibilityLabel='Register Prev 10000'
            testID='register_prev_10000_button'
          />
        </View>
      </View>
    </View>
  );
};

export default RegisterError;


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