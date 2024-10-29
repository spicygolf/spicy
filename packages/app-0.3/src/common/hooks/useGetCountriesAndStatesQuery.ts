import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client';

export const query = gql`
  query getCountriesAndStates {
    getCountriesAndStates {
      name
      code
      crs_code
      states {
        name
        code
        course_code
      }
    }
  }
`;

export const useGetCountriesAndStatesQuery = (options: object) => {
  return useQuery(query, options);
};
