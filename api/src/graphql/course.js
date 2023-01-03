import { Course } from '../models/course';

export const CourseTypeDefs = `
type Course {
  _key: String!
  course_id: Int
  name: String
  city: String
  state: String
  tees: [Tee]
}

type CourseKey {
  _key: String!
}

`;

export const CourseQuerySigs = `
  getCourse(courseKey: String!): Course
  searchCourse(q: String!): [Course]
`;

export const CourseMutationSigs = `
`;

export const CourseResolvers = {
  Query: {
    getCourse: async (_, { courseKey }) => {
      const c = new Course();
      return c.load(courseKey);
    },
    searchCourse: async (_, { q }) => {
      if( q == '' ) return [];
      let c = new Course();
      const cursor = await c.search('name', q);
      return cursor.all();
    },
  },
  Course: {
    tees: async (course) => {
      const c = new Course();
      return c.getTees(course._id);
    }
  },
  Mutation: {
  }
};
