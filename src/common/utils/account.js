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

  // navigate to account stack
  navigation.navigate('Account');
};

export const validateEmail = email => {
  if( !email ) return false;
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

export const validatePassword = pass => {
  if( !pass ) return false;
  if( pass.length > 3 ) return true;
}

export const validateName = name => {
  if( !name ) return false;
  var re = /^[a-zA-Z ]+$/;
  return re.test(String(name).toLowerCase());
};

export const validateInteger = number => {
  if( !number ) return false;
  return Number.isInteger(parseInt(number));
};

export const build_qs = args => {
  const a = [];
  for( let key in args ) {
    if( args.hasOwnProperty(key) ) {
      a.push(`${key}=${args[key]}`);
    }
  }
  return a.join('&');
};
