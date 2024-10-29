import { getCountriesAndStates, login } from '../models/account';

export const AccountTypeDefs = `
  type LoginResponse {
    player: Player
    message: String
  }

  type Country {
    name: String
    code: String
    crs_code: String
    states: [State]
  }

  type State {
    name: String
    code: String
    course_code: String
  }
`;

export const AccountQuerySigs = `
  login(email: String!, fbToken: String!): LoginResponse!
  getCountriesAndStates: [Country]
`;

export const AccountMutationSigs = `
`;

export const AccountResolvers = {
  Query: {
    login,
    getCountriesAndStates,
  },
  Mutation: {
  }
};
