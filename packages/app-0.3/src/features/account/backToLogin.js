import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const BackToLogin = (props) => {
  const navigation = useNavigation();

  return (
    <View style={styles.login_view}>
      <Text style={styles.login_text}>
        Already have an account?
        <Text
          onPress={() => {
            navigation.navigate('Login');
          }}
          style={styles.login_button}
        >
          {' '}
          Login
        </Text>
      </Text>
    </View>
  );
};

export default BackToLogin;

const styles = StyleSheet.create({
  login_button: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  login_text: {
    color: '#ccc',
  },
  login_view: {
    paddingLeft: 15,
    paddingTop: 15,
  },
});
