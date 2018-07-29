import gql from 'graphql-tag';

export default gql`
  query CurrentPlayer  {
    currentPlayer {
      _key
      name
      short
    }
  }
`;
