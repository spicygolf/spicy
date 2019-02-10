import React from 'react';

import { Mutation } from 'react-apollo';

import gql from 'graphql-tag';



export const ADD_LINK_MUTATION = gql`
  mutation link($from: LinkInput!, $to: LinkInput!) {
    link(from: $from, to: $to) {
      _key
    }
  }
`;

export class AddLinkMutation extends React.PureComponent {

  render() {
    const { children, from, to } = this.props;
    return (
      <Mutation
        mutation={ADD_LINK_MUTATION}
        variables={{
          from: from,
          to: to
        }}
      >
        {mutate => {
          return children({
            addLinkMutation: mutate
          });
        }}
      </Mutation>
    );
  }

};
