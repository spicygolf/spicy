import React from 'react';

import { Query } from 'react-apollo';

import gql from 'graphql-tag';



export const GET_COURSE_FOR_GAME_QUERY = gql`
  query GetCourseForGame($gkey: String!) {
    getCourseForGame(gkey: $gkey) {
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

export class GetCourseForGame extends React.PureComponent {
  render() {
    const { children, gkey} = this.props;
    return (
      <Query
        query={GET_COURSE_FOR_GAME_QUERY}
        variables={{
          gkey: gkey
        }}
      >
        {({ data, loading }) => {
          let course = {};
          if (data && data.getCourseForGame) {
            course = data.getCourseForGame;
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
