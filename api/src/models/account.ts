import { next } from '../util/database';
import jwt from 'jsonwebtoken';

type LoginRequest = {
  email: string;
  fbToken: string;
};

type TokenPayload = {
  pkey: string;
  level: string;
};
// TODO: graphql codegen for types

export const login = async (_: any, {email, fbToken}: LoginRequest) => {

  // fetch player from database based on email
  const query = `
    FOR p IN players
      FILTER p.email == "${email}"
      RETURN p
  `;
  const player = await next({query});
  if (!player) {
    return {
      message: "email_does_not_exist",
    }
  }

  // validate fbToken with Firebase API
  const match = true; // TODO: validate
  if (!match) {
    return {
      message: "firebase_token_not_valid",
    }
  }

  // generate token and return pkey/token
  if( player && match ) {
    return ({
      pkey: player._key,
      token: createToken({
        pkey: player._key,
        level: player.level || ""
      })
    });
  }

};

export const createToken = (payload: TokenPayload) => {
  const {JWT_SECRET} = process.env;
  return jwt.sign(payload, JWT_SECRET, {expiresIn: "30d"});
};
