import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const Error = (props) => {
  const { error } = props;

  return (
    <View>
      <Text style={styles.title}>Sorry, the app just took a double bogey.</Text>
      <Text style={styles.message}>{JSON.stringify(error, null, 2)}</Text>
    </View>
  );
};

export default Error;

export const styles = StyleSheet.create({
  title: {
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  message: {
    fontFamily: 'Courier New',
  },
});
