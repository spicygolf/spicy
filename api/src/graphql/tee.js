import { Tee } from '../models/tee';

export const TeeTypeDefs = `
type Tee {
  tee_id: Int
  tee_name: String
  gender: String
  holes_number: Int
  total_yardage: Int
  total_meters: Int
  total_par: Int
  ratings: [Rating]
  holes: [Hole]
  course: TeeCourse
  course_handicap: Int
  game_handicap: Int
}

type Rating {
  rating_type: String
  course_rating: Float
  slope_rating: Float
  bogey_rating: Float
}

type Hole {
  number: Int
  hole_id: Int
  length: Int
  par: Int
  allocation: Int
}

type TeeCourse {
  course_id: Int
  course_status: String
  course_name: String
  course_number: Int
  course_city: String
  course_state: String
}
`;

export const TeeQuerySigs = `
  getFavoriteTeesForPlayer(pkey: String!, gametime: String): [Tee]
`;

export const TeeMutationSigs = `
`;

export const TeeResolvers = {
  Query: {
    getFavoriteTeesForPlayer: async (_, { pkey, gametime }) => {
      const t = new Tee();
      return t.getFavoriteTeesForPlayer(pkey, gametime);
    },
  },
  Mutation: {
  },
};
