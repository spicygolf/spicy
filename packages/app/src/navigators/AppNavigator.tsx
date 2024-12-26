import React from 'react';
import { SafeAreaView, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

// import { createStaticNavigation } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';

export default function AppNavigator() {
  return (
    <SafeAreaView styles={styles.container}>
      <Text style={styles.title}>AppNavigator</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
});
