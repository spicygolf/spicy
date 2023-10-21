// for react-native:  Caching Without Redux section
// https://www.bacancytechnology.com/blog/react-native-offline-support

// for react:
// https://blog.logrocket.com/using-localstorage-react-hooks/

import { CacheSetArgs, CacheGetArgs } from 'spicylib/types';

export const set = ({type, payload}: CacheSetArgs) => {
  try {
    const key = `${type}/${payload.id}`;
    localStorage.setItem(key, JSON.stringify(payload));
  } catch(e) {
    console.error(e);
  }
};

export const get = ({type, id}: CacheGetArgs) => {
  try {
    const key = `${type}/${id}`;
    return localStorage.getItem(key);
  } catch(e) {
    console.error(e);
  }
};
