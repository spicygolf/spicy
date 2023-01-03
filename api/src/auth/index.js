import { Player } from '../models/player';
import config from '../config';
import jwt from 'jsonwebtoken';

let internals = {};

const { sign } = jwt;

// private key for signing
const { crypto } = config;
internals.privateKey = crypto.privateKey;

/**
 *
 * ## validate
 *
 *  When a route is configured w/ 'auth', this validate function is
 * invoked
 *
 * If the token wasn't invalidated w/ logout, then validate
 * it is for a user
 *
 * When a user logs out, the token they were using is saved to ????? Redis?
 * and checked here to prevent re-use
 *
 */
internals.validate = async (decodedToken, request) => {

  let credentials = {};

  //credentials have 'Bearer dfadfsdf' in authorization header
  const headers = request.headers.authorization.split(' ');
  if (headers.length === 2) {
    // do we have a user?
    // note we're only using 'pkey' - that's because
    // the user can change their username (email)
    var p = new Player();
    const creds = await p.load(decodedToken.pkey);

    if( creds && creds._key && creds._key === decodedToken.pkey ) {
      credentials = {
        pkey: creds.pkey,
        email: creds.email,
        name: creds.name,
        level: creds.level,
        emailVerified: creds.emailverified
      };
      // successful validation
      return {
        isValid: true,
        credentials: credentials
      };
    }
  }

  // must be invalid token
  return {
    isValid: false
  };
};


// create token
internals.createToken = obj => sign(obj, internals.privateKey);


export const validate = internals.validate;
export const createToken = internals.createToken;
