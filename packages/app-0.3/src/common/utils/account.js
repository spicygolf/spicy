import AsyncStorage from '@react-native-async-storage/async-storage';
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
      'Content-Type': 'application/json',
    },
  });
  const payload = await res.json();
  console.log('register payload', payload);
  return payload;
};

export const login = async fbUser => {
  let token = '';
  if (fbUser.getIdToken) {
    token = await fbUser.getIdToken();
  }

  // REST call to API to get pkey, token
  const uri = `${scheme}://${baseUri}/account/login`;
  // console.log('uri', uri);
  const res = await fetch(uri, {
    method: 'POST',
    body: JSON.stringify({
      email: fbUser.email,
      fbToken: token,
    }),
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json',
    },
  });
  // console.log('res', res);
  const payload = await res.json();
  // console.log('login payload', payload);

  let ret = null;
  switch (res.status) {
    case 200:
      ret = {
        currentPlayerKey: payload.pkey,
        //currentPlayerKey: '117972196', // Chris H Carter - old - for dev
        //currentPlayerKey: '65882229',  // Chris H Carter - new - for dev
        token: payload.token,
      };
      break;
    case 401:
      // we got thru Firebase, but not SpicyGolf login.  Did we have a failed
      // registration?
      console.log('login forbidden');
      ret = {
        message: 'Got thru Firebase login, but not SpicyGolf.',
        navTo: 'RegisterAgain',
      };
      break;
    default:
      // TODO: handle errors
      console.log('login error - payload', payload);
      ret = payload;
  }
  return ret;
};

export const logout = async client => {
  // zap local storage
  await AsyncStorage.removeItem('token');

  // zap cache
  try {
    // clear apollo client cache/store
    if (client && typeof client.clearStore === 'function') {
      client.clearStore();
    }
  } catch (e) {
    console.error('err client', e);
  }

  // call API logout endpoint
  await auth().signOut();
  return true;
};

export const clearCache = async client => {
  await client.clearStore();
  // client.cache.data.clear();
  for( const key of Object.keys(client.cache.data.data) ) {
    const e = client.cache.evict({id: key});
    console.log('evict', key, e);
  }
  const gc = client.cache.gc();
  console.log('gc', gc);
  console.log('cache', client.cache.data.data);
  return true;
};

export const getCurrentUser = fbUser => {
  return login(fbUser)
    .then(login_res => {
      // console.log('login_res', login_res);
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

export const validate = (type, text) => {
  let ret = false;

  switch (type) {
    case 'email':
      ret = validateEmail(text);
      break;
    case 'password':
      ret = validatePassword(text);
      break;
    case 'name':
      ret = validateName(text);
      break;
    case 'int':
      ret = validateInteger(text);
      break;
    case 'float':
      ret = validateFloat(text);
      break;
    default:
      break;
  }

  return ret;
};

export const validateEmail = email => {
  if (email === '') {
    return true;
  }
  if (!email) {
    return false;
  }
  var re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

export const validatePassword = pass => {
  if (pass === '') {
    return true;
  }
  if (!pass) {
    return false;
  }
  if (pass.length > 3) {
    return true;
  }
};

export const validateName = name => {
  if (!name) {
    return false;
  }
  var re = /^[a-zA-Z ]+$/;
  return re.test(String(name).toLowerCase());
};

export const validateInteger = number => {
  if (!number) {
    return false;
  }
  return Number.isInteger(parseInt(number, 10));
};

export const validateFloat = number => {
  if (!number) {
    return false;
  }
  return !Number.isNaN(parseFloat(number));
};

export const build_qs = args => {
  const a = [];
  for (let key in args) {
    if (args.hasOwnProperty(key)) {
      a.push(`${key}=${args[key]}`);
    }
  }
  return a.join('&');
};

export const parseFirebaseError = e => {
  const split = e.message.split(']');
  let slug = '';
  if (split && split[0]) {
    let slugSplit = split[0].split('[');
    if (slugSplit && slugSplit[1]) {
      slug = slugSplit[1].trim();
    }
  }
  let message = e.message;
  if (split && split[1]) {
    message = split[1].trim();
  }

  return {
    slug,
    message,
  };
};
