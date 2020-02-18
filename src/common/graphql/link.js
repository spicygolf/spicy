import React from 'react';

import { Mutation } from 'react-apollo';

import gql from 'graphql-tag';



export const ADD_LINK_MUTATION = gql`
  mutation link($from: LinkInput!, $to: LinkInput!, $other: [KV]) {
    link(from: $from, to: $to, other: $other) {
      _key
    }
  }
`;

export const UPDATE_LINK_MUTATION = gql`
  mutation update($from: LinkInput!, $to: LinkInput!, $other: [KV]) {
    update(from: $from, to: $to, other: $other)
  }
`;

export class AddLinkMutation extends React.PureComponent {

  render() {
    const { children } = this.props;
    return (
      <Mutation mutation={ADD_LINK_MUTATION}>
        {mutate => {
          return children({
            addLinkMutation: mutate
          });
        }}
      </Mutation>
    );
  }

};
