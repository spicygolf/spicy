import { gql } from '@apollo/client';

export const REMOVE_LINK_MUTATION = gql`
  mutation unlink($from: LinkInput!, $to: LinkInput!) {
    unlink(from: $from, to: $to)
  }
`;
