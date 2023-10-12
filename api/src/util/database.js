import { db } from '../db/db';

export const mutate = async ({mutation, options = {}, debug}) => {
  let ret = {
    success: false,
    message: 'Unknown error',
  };

  try {
    const cursor = await db.query(mutation, options);
    const res = await cursor.next();
    if (debug) {
      console.log("mutate", res);
    }
    ret = {
      success: true,
      _key: res?._key,
    };
  } catch (e) {
    ret = {
      success: false,
      message: e.message,
    };
  }

  return ret;
};

export const all = async ({query, options = {}, debug}) => {
  try {
    const cursor = await db.query(query, options);
    if (debug) {
      const ret = await cursor.all();
      console.log("debug", ret);
      return ret;
    } else {
      return cursor.all();
    }
  } catch (e) {
    console.error(e);
    // TODO: throw a slug for front end graphql?
    return e;
  }
};

export const next = async ({query, options = {}, debug}) => {
  try {
    const cursor = await db.query(query, options);
    if (debug) {
      const ret = await cursor.next();
      console.log("debug", ret);
      return ret;
    } else {
      return cursor.next();
    }
  } catch (e) {
    console.error(e);
    // TODO: throw a slug for front end graphql?
    return e;
  }
};
