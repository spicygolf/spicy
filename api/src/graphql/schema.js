import { gql } from 'apollo-server-hapi';
import { flattenDeep, merge } from 'lodash-es';

import {
  ClubMutationSigs,
  ClubQuerySigs,
  ClubResolvers,
  ClubTypeDefs
} from './club';
import {
  CourseMutationSigs,
  CourseQuerySigs,
  CourseResolvers,
  CourseTypeDefs
} from './course';
import {
  EventMutationSigs,
  EventQuerySigs,
  EventResolvers,
  EventTypeDefs
} from './event';
import {
  GameMutationSigs,
  GameQuerySigs,
  GameResolvers,
  GameSubscriptionSigs,
  GameTypeDefs,
} from './game';
import {
  GameSpecMutationSigs,
  GameSpecQuerySigs,
  GameSpecResolvers,
  GameSpecTypeDefs
} from './gamespec';
import {
  LinkMutationSigs,
  LinkQuerySigs,
  LinkResolvers,
  LinkTypeDefs
} from './link';
import {
  OptionMutationSigs,
  OptionQuerySigs,
  OptionResolvers,
  OptionTypeDefs
} from './option';
import {
  PlayerMutationSigs,
  PlayerQuerySigs,
  PlayerResolvers,
  PlayerTypeDefs
} from './player';
import {
  RoundMutationSigs,
  RoundQuerySigs,
  RoundResolvers,
  RoundSubscriptionSigs,
  RoundTypeDefs
} from './round';
import {
  SharedTypeDefs
} from './shared';
import {
  TeeMutationSigs,
  TeeQuerySigs,
  TeeResolvers,
  TeeTypeDefs
} from './tee';

const TypeDefs = [
  SharedTypeDefs,
  ClubTypeDefs,
  CourseTypeDefs,
  EventTypeDefs,
  GameSpecTypeDefs,
  GameTypeDefs,
  LinkTypeDefs,
  OptionTypeDefs,
  PlayerTypeDefs,
  RoundTypeDefs,
  TeeTypeDefs,
];

const RootQuery = `
type Query {
  ${ClubQuerySigs}
  ${CourseQuerySigs}
  ${EventQuerySigs}
  ${GameSpecQuerySigs}
  ${GameQuerySigs}
  ${LinkQuerySigs}
  ${OptionQuerySigs}
  ${PlayerQuerySigs}
  ${RoundQuerySigs}
  ${TeeQuerySigs}
}
`;

const RootMutation = `
type Mutation {
  ${ClubMutationSigs}
  ${CourseMutationSigs}
  ${EventMutationSigs}
  ${GameSpecMutationSigs}
  ${GameMutationSigs}
  ${LinkMutationSigs}
  ${OptionMutationSigs}
  ${PlayerMutationSigs}
  ${RoundMutationSigs}
  ${TeeMutationSigs}
}
`;

const RootSubscription = `
  type Subscription {
    ${GameSubscriptionSigs}
    ${RoundSubscriptionSigs}
  }
`;

const resolvers = merge(
  ClubResolvers,
  CourseResolvers,
  EventResolvers,
  GameSpecResolvers,
  GameResolvers,
  LinkResolvers,
  OptionResolvers,
  PlayerResolvers,
  RoundResolvers,
  TeeResolvers,
);

export const schema = {
  typeDefs: flattenDeep([
    gql`${TypeDefs}`,
    gql`${RootQuery}`,
    gql`${RootMutation}`,
    gql`${RootSubscription}`,
  ]),
  resolvers: resolvers,
};
