import AsyncStorage from '@react-native-community/async-storage';

export const logout = async ({navigation, client}) => {

  // zap local storage
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('currentPlayer');

  // zap cache
  console.log('logout client', client);
  try {
    // clear apollo client cache/store
    if (client && typeof client.clearStore === 'function') {
      client.clearStore()
    }
  } catch (e) {
    console.error('err client', e)
  }

  // call API logout endpoint
  // TODO: ^

  // navigate to login page
  navigation.navigate('Auth');
};
