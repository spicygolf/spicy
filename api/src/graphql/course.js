import { Course } from '../models/course';

export const CourseTypeDefs = `
type Course {
  course_id: Int
  course_status: String
  course_name: String
  facility_id: Int
  facility_status: String
  facility_name: String
  fullname: String
  geo_location_formatted_address: String
  geo_location_latitude: Float
  geo_location_longitude: Float
  city: String
  state: String
  country: String
  updated_on: String
  season_name: String
  season_start_date: String
  season_end_date: String
  is_all_year: Boolean
  tees: [Tee]
}

input GetCourse {
  source: String!
  course_id: Int!
  include_altered_tees: Boolean
}

input SearchCourse {
  name: String
  facility_id: Int
  country: String
  state: String
}
`;

export const CourseQuerySigs = `
  getCourse(q: GetCourse!): Course
  searchCourse(q: SearchCourse!): [Course]
`;

export const CourseMutationSigs = `
`;

export const CourseResolvers = {
  Query: {
    getCourse: async (_, { q }) => {
      const c = new Course();
      return c.getCourse({ q });
    },
    searchCourse: async (_, { q }) => {
      if (q.course_name === '') return [];
      let c = new Course();
      return c.searchCourse({ q });
    },
  },
  Mutation: {},
};
