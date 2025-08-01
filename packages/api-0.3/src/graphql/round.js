import { Round, linkRound } from '../models/round';
import { withFilter } from 'graphql-subscriptions';

const SCORE_POSTED = "SCORE_POSTED"

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
  tees: [Tee]
  scores: [Score]
  player: [Player]
  handicap_index: String
  posting: Posting
}

type RoundKey {
  _key: String!
}

input RoundInput {
  _key: String
  date: String!
  seq: Int!
  tees: [TeeInput]
  scores: [ScoreInput]
  player: [PlayerInput]
  handicap_index: String
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
  getRoundsForPlayerDay(pkey: String!, day: String!): [Round]
`;

export const RoundMutationSigs = `
  linkRound(
    gkey: String!
    player: PlayerInput!
    isNewRound: Boolean!
    round: RoundInput
    newHoles: [GameHoleInput]
    currentPlayerKey: String!
  ): Response
  addTeeToRound(rkey: String!, course_id: Int, tee_id: Int, course_handicap: Int): Round
  removeTeeFromRound(rkey: String!, tee_id: Int): Round
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

export const RoundResolvers = {
  Query: {
    getRoundsForPlayerDay: async (_, { pkey, day }) => {
      let r = new Round();
      return r.getRoundsForPlayerDay(pkey, day);
    },
  },
  Mutation: {
    linkRound,
    addRound: (_, { round }) => {
      // TODO: add to immutable message log?
      let r = new Round();
      r.set(round);
      return r.save();
    },
    addTeeToRound: async (_, tee) => {
      let r = new Round();
      return r.addTeeToRound(tee);
    },
    removeTeeFromRound: async (_, tee) => {
      let r = new Round();
      return r.removeTeeFromRound(tee);
    },
    postScore: (_root, args, _context) => {
      const { rkey, score } = args;
      // publish changes for subscriptions
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
    tees: (round) => {
      let r = new Round();
      return r.getTees(round);
    },
  },
};
