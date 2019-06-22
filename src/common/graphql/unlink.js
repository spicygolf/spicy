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
//    console.log('RemoveLinkMutation props', this.props);
    const { children, from, to } = this.props;
//    console.log('from/to', from, to);
    return (
      <Mutation mutation={REMOVE_LINK_MUTATION}>
        {mutate => {
          return children({
            removeLinkMutation: mutate
          });
        }}
      </Mutation>
    );
  }

};
