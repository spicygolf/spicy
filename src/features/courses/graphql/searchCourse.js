import gql from 'graphql-tag';

export default gql`
  query SearchCourse($q: String!) {
    searchCourse(q: $q) {
      _key
      name
      city
      state
      tees {
        _key
        name
        gender
        rating {
          all18
          front9
          back9
        }
        slope {
          all18
          front9
          back9
        }
      }
    }
  }
`;
