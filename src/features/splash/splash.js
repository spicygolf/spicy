import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';



const Splash = props => {

  return (
    <View style={styles.container}>
      <Text>Spicy Golf</Text>
      <Text>Splash Page</Text>
    </View>
  );

};

export default Splash;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
