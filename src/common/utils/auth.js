import { AsyncStorage } from 'react-native';
import { Actions } from 'react-native-router-flux';


export const logout = async (client) => {

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
  Actions.login();
};
