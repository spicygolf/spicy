import { gql, useMutation } from '@apollo/client';

const mutation = gql`
  mutation LinkRound(
    $gkey: String!
    $player: PlayerInput!
    $isNewRound: Boolean!
    $round: RoundInput
    $newHoles: [GameHoleInput]
    $currentPlayerKey: String!
  ) {
    linkRound(
      gkey: $gkey
      player: $player
      isNewRound: $isNewRound
      round: $round
      newHoles: $newHoles
      currentPlayerKey: $currentPlayerKey
    ) {
      success
      _key
      message
    }
  }
`;

export const useLinkRoundMutation = (options: object) => {
  return useMutation(mutation, options);
};
