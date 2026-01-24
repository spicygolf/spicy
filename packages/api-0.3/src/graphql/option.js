import { Option } from "../models/option";

export const OptionTypeDefs = `
type Choice {
  name: String
  disp: String
}

type OptionSpec {
  name: String!
  disp: String
  seq: Int
  type: String!
  sub_type: String
  choices: [Choice]
  default: String
  value: Float
  limit: String
  scope: String
  icon: String
  show_in: String
  score_to_par: String
  based_on: String
  calculation: String
  availability: String
  logic: String
  better: String
  after: String
  input_value: Boolean
  override: Boolean
  values: [OptionValue]
}
`;

export const OptionQuerySigs = `
  getOption(_key: String!): OptionSpec
  findOption(name: String!): OptionSpec
  searchOption(q: String!): [OptionSpec]
`;

export const OptionMutationSigs = `

`;

export const OptionResolvers = {
  Query: {
    getOption: (_, { _key }) => {
      var o = new Option();
      return o.load(_key);
    },
    findOption: (_, { name }) => {
      var o = new Option();
      return o
        .find(name)
        .then((res) => (res?.[0] ? res[0] : null))
        .catch((_err) => null);
    },
    searchOption: async (_, { q }) => {
      var o = new Option();
      const cursor = await o.search(q);
      return cursor.all();
    },
  },
  Mutation: {},
};
