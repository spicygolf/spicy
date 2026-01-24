import countries_and_states_json from '../../../data/countries_and_states.json' assert {type: 'json'};

const {
  API_VERSION: api,
} = process.env;

const handlers = {
  countries_and_states: async (_req, _h) => {
    return countries_and_states_json;
  },
};

export const ghinRoutes = [
  {
    path: `/${api}/ghin/countries_and_states`,
    method: 'GET',
    handler: handlers.countries_and_states,
    config: {
      auth: false,
      tags: ['api'], // Include this API in swagger documentation
      description: 'GHIN Countries & States',
      notes: `Get GHIN's version of Countries & States`,
    }
  },
];
