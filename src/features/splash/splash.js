import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  View
} from 'react-native';



const Splash = props => {

  const logo = require('../../../assets/img/logo200.png');

  return (
    <View style={styles.container}>
      <Image
        source={logo}
      />
    </View>
  );

};

export default Splash;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b30000',
  },
});
