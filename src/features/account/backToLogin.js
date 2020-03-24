import React from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { blue } from 'common/colors';


const BackToLogin = props => {

  const navigation = useNavigation();

  return (
    <View style={styles.login_view}>
      <Text>
        Already have an account?
        <Text
          onPress={() => { navigation.navigate('Login'); }}
          style={styles.login_text}
        >  Login</Text>
      </Text>
    </View>
  );

};

export default BackToLogin;


const styles = StyleSheet.create({
  login_view: {
    padding: 15,
    paddingBottom: 40,
  },
  login_text: {
    fontWeight: 'bold',
    marginLeft: 6,
    color: blue,
  },
});
