import { withFilter } from 'apollo-server-hapi';

import { Round } from '../models/round';
import { pubsub } from '../server';

export const RoundTypeDefs = `
type Value {
  k: String!
  v: String!
  ts: String
}

input ValueInput {
  k: String!
  v: String!
  ts: String
}

type Score {
  hole: String!
  values: [Value]
  pops: String
  coursePops: String
}

input ScoreInput {
  hole: String!
  values: [ValueInput]
}

type Round {
  _key: String!
  date: String!
  seq: Int!
  tee: Tee
  scores: [Score]
  player: [Player]
  handicap_index: String
  game_handicap: String
  course_handicap: String
  posting: Posting
}

type RoundKey {
  _key: String!
}

input RoundInput {
  date: String!
  seq: Int!
  scores: [ScoreInput]
  game_handicap: Int
  course_handicap: Int
}

type ScorePostedSubscription {
  scorePosted(rkey: String!): Round
}

type Posting {
  id: String
  adjusted_gross_score: Int
  differential: Float
  date_validated: String
  exceptional: Boolean
  posted_by: String
  estimated_handicap: String
  success: Boolean
  messages: [String!]
}

`;

export const RoundQuerySigs = `
  getRound(_key: String!): Round
  getRoundsForPlayerDay(pkey: String!, day: String!): [Round]
`;

export const RoundMutationSigs = `
  addRound(round: RoundInput!): RoundKey
  postScore(rkey: String!, score: ScoreInput!): Round
  deleteRound(rkey: String!): RoundKey
  postRoundToHandicapService(
    rkey: String!,
    posted_by: String!
  ): Round
`;

export const RoundSubscriptionSigs = `
  scorePosted(rkey: String!): Round
`;

const SCORE_POSTED = 'SCORE_POSTED';

export const RoundResolvers = {
  Query: {
    getRound: (_, { rkey }) => {
      let r = new Round();
      return r.load(rkey);
    },
    getRoundsForPlayerDay: async (_, { pkey, day }) => {
      let r = new Round();
      return r.getRoundsForPlayerDay(pkey, day);
    },
  },
  Mutation: {
    addRound: (_, { round }) => {
      // TODO: add to immutable message log?
      let r = new Round();
      r.set(round);
      return r.save();
    },
    postScore: (_root, args, _context) => {
      const { rkey, score } = args;
      pubsub.publish(SCORE_POSTED, {
        scorePosted: {
          _key: rkey,
          scores: [score],
        },
      });
      let r = new Round();
      return r.postScore(rkey, score);
    },
    deleteRound: (_, { rkey }) => {
      let r = new Round();
      return r.remove(rkey);
    },
    postRoundToHandicapService: (_, { rkey, posted_by }) => {
      let r = new Round();
      return r.postRoundToHandicapService(rkey, posted_by);
    },
  },
  Subscription: {
    scorePosted: {
      subscribe: withFilter(
        () => {
          //console.log('scorePosted subscribe', pubsub);
          return pubsub.asyncIterator([SCORE_POSTED]);
        },
        (payload, variables) => {
          return (payload.scorePosted._key === variables.rkey);
        },
      ),
    }
  },
  Round: {
    player: (round) => {
      let r = new Round();
      return r.getPlayer(round._key);
    },
    tee: () => {},
  },
};
