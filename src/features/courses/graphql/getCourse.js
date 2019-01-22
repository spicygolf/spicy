import React from 'react';

import { Query } from 'react-apollo';

import gql from 'graphql-tag';



export const GET_COURSE_QUERY = gql`
  query GetCourse($courseKey: String!) {
    getCourse(courseKey: $courseKey) {
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

export class GetCourse extends React.PureComponent {
  render() {
    const { children, courseKey} = this.props;
    return (
      <Query
        query={GET_COURSE_QUERY}
        variables={{
          courseKey: courseKey
        }}
      >
        {({ data, loading }) => {
          let course = {};
          if (data && data.getCourse) {
            course = data.getCourse;
          }
          return children({
            course,
            loading
          });
        }}
      </Query>
    );
  }
}
