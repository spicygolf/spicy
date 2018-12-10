import { AsyncStorage } from 'react-native';
import { Actions } from 'react-native-router-flux';


export const logout = async (client) => {
  console.log('logout client', client);
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('currentPlayer');

  try {
    // clear apollo client cache/store
    if (client && typeof client.clearStore === 'function') {
      client.clearStore()
    }
  } catch (e) {
    console.error('err client', e)
  }

  Actions.login();
};
