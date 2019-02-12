import React from 'react';

import { Mutation } from 'react-apollo';

import gql from 'graphql-tag';



export const REMOVE_LINK_MUTATION = gql`
  mutation unlink($from: LinkInput!, $to: LinkInput!) {
    unlink(from: $from, to: $to)
  }
`;

export class RemoveLinkMutation extends React.PureComponent {

  render() {
    const { children, from, to } = this.props;
    return (
      <Mutation
        mutation={REMOVE_LINK_MUTATION}
        variables={{
          from: from,
          to: to
        }}
      >
        {mutate => {
          return children({
            removeLinkMutation: mutate
          });
        }}
      </Mutation>
    );
  }

};
