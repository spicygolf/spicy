import { gql, useMutation } from '@apollo/client';

const UPDATE_GAME_OPTIONS_MUTATION = gql`
  mutation UpdateGameOptions($gkey: String!, $options: [GameOptionInput]!) {
    updateGameOptions(gkey: $gkey, options: $options) {
      _key
      options {
        name
        values {
          value
          holes
        }
      }
    }
  }
`;

const useCustomOptionUpdateMutation = ({ gkey, options }) => {
  const [updateGameOptions] = useMutation(UPDATE_GAME_OPTIONS_MUTATION, {
    variables: {
      gkey,
      options,
    },
  });
  return updateGameOptions;
};

export default useCustomOptionUpdateMutation;
