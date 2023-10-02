import { login } from '../models/account';

export const AccountTypeDefs = `
  type LoginResponse {
    pkey: String
    token: String
    message: String
  }
`;

export const AccountQuerySigs = `
  login(email: String!, fbToken: String!): LoginResponse!
`;

export const AccountMutationSigs = `
`;

export const AccountResolvers = {
  Query: {
    login,
  },
  Mutation: {
  }
};
