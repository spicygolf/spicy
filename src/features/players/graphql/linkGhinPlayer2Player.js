import gql from 'graphql-tag';

export default gql`
  mutation LinkGhinPlayer2Player($gpkey: String!, $pkey: String) {
    linkGhinPlayer2Player(gpkey: $gpkey, pkey: $pkey) {
      gpkey
      pkey
    }
  }
`;

export const linkGhinPlayer2Player = async (gpkey, pkey) => {

};
