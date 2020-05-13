import AsyncStorage from '@react-native-community/async-storage';
import auth from '@react-native-firebase/auth';

import { baseUri, scheme } from 'common/config';



export const registerPlayer = async (registration, fbUser) => {

  // REST call to register player
  const uri = `${scheme}://${baseUri}/account/register`;

  const res = await fetch(uri, {
    method: 'POST',
    body: JSON.stringify({
      ...registration,
      fbUser: fbUser,
    }),
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json'
    }
  });
  const payload = await res.json();
  console.log('register payload', payload);

};

export const login = async fbUser => {

  const token = await fbUser.getIdToken();

  // REST call to API to get pkey, token
  const uri = `${scheme}://${baseUri}/account/login`;

  const res = await fetch(uri, {
    method: 'POST',
    body: JSON.stringify({
      email: fbUser.email,
      fbToken: token,
    }),
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json'
    }
  });
  const payload = await res.json();
  //console.log('login payload', payload);

  let ret = null;
  switch( res.status ) {
    case 200:
      ret = {
        currentPlayerKey: payload.pkey,
        token: payload.token,
      };
      break;
    default:
      // TODO: handle errors
      console.log('login error - payload', payload);
  }
  return ret;
};

export const logout = async client => {

  // zap local storage
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('currentPlayer');

  // zap cache
  try {
    // clear apollo client cache/store
    if (client && typeof client.clearStore === 'function') {
      client.clearStore()
    }
  } catch (e) {
    console.error('err client', e)
  }

  // call API logout endpoint
  await auth().signOut();

};

export const getCurrentUser = fbUser => {
  return login(fbUser)
    .then(login_res => {
      return {
        ...login_res,
        fbUser: fbUser,
      };
    })
    .catch(e => {
      //console.log('getCurrentUser error', e);
      return e;
    });
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

export const validateFloat = number => {
  if( !number ) return false;
  return !Number.isNaN(parseFloat(number));
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
