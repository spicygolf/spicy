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
  let player = await next({query});
  if (!player) {
    return {
      message: "user_not_logged_in",
    }
  }

  // validate fbToken with Firebase API
  const match = true; // TODO: validate
  if (!match) {
    return {
      message: "user_not_logged_in",
    }
  }

  // generate token and return pkey/token
  if( player && match ) {
    delete player.fbUser;
    return ({
      player: {
        ...player,
        token: createToken({
          pkey: player._key,
          level: player.level || ""
        }),
      },
      message: "user_logged_in",
    });
  }

};

export const createToken = (payload: TokenPayload) => {
  const {JWT_SECRET} = process.env;
  return jwt.sign(payload, JWT_SECRET, {expiresIn: "30d"});
};
