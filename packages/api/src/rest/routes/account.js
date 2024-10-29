import Boom from '@hapi/boom';
import Joi from '@hapi/joi';
import { Player } from '../../models/player';

const {
  API_VERSION: api,
} = process.env;


const handlers = {
  register: async (req, h) => {
    //console.log('register');
    let newPlayer = Object.assign({}, req.payload);

    // write new user to db
    let p = new Player();
    const player = await p.register(newPlayer);
    //console.log('register result', player);
    if( player && !player.error ) {
      // Let the user know they are registered
      return ({
        statusCode: 201,
        pkey: player._key,
        token: createToken({
          pkey: player._key,
          level: player.level || 0
        })
      });
    }
    const error = (player && player.error) ? player.error : {code:500};
    if( error.code == 409 ) {
      console.error(error, newPlayer);
      return Boom.conflict(error.message);
    }
    console.error('Unknown error registering player', error, newPlayer);
    return Boom.badImplementation(`Unknown error registering player: ${error}`);
  },


  logout: async (req, h) => {
    // TODO: blacklist the existing token (req.headers.token?) in Arango or
    //       other memory store, like Redis
    return {
      logout: true
    };
  },

  forgot: async ( req, h) => {

  },
};

export const accountRoutes = [
  {
    path: `/${api}/account/register`,
    method: 'POST',
    handler: handlers.register,
    config: {
      auth: false,
      tags: ['api'], // Include this API in swagger documentation
      description: 'Register user',
      notes: 'Register a new user, store in db, and send verification email',
      validate: {
        payload: Joi.object({
          email: Joi.string().email().required(),
          name: Joi.string().required(),
          short: Joi.string(),
          handicap: Joi.any(),
          ghinData: Joi.any(),
          fbUser: Joi.any(),
        }).options({ stripUnknown: true})
      }
    }
  },
  {
    path: `/${api}/account/logout`,
    method: 'POST',
    handler: handlers.logout,
    config: {
      auth: 'jwt',
      tags: ['api'], // Include this API in swagger documentation
      description: 'Log user out',
      notes: `Log user out of system, invalidate token.`,
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown()
      }
    }
  },
];
