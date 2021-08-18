import { useMutation } from '@apollo/client';
import { REMOVE_LINK_MUTATION } from 'common/graphql/unlink';
import { GET_GAME_QUERY } from 'features/game/graphql';
import React from 'react';
import { Icon } from 'react-native-elements';

const RemovePlayer = (props) => {
  const { pkey, gkey, rkey } = props;
  const [unlink] = useMutation(REMOVE_LINK_MUTATION);

  const _removePlayer = () => {
    //console.log('removePlayer', pkey, gkey, rkey);
    if (pkey && gkey) _removePlayer2Game();
    if (rkey && gkey) _removeRound2Game();
  };

  const _removePlayer2Game = () => {
    // remove player2game link
    try {
      const { loading, data, error } = unlink({
        variables: {
          from: { type: 'player', value: pkey },
          to: { type: 'game', value: gkey },
        },
        refetchQueries: [
          {
            query: GET_GAME_QUERY,
            variables: {
              gkey: gkey,
            },
          },
        ],
        awaitRefetchQueries: true,
      });
      if (error) throw error;
    } catch (e) {
      console.log('error removing player from game', e);
    }
  };

  const _removeRound2Game = () => {
    try {
      const { loading, data, error } = unlink({
        variables: {
          from: { type: 'round', value: rkey },
          to: { type: 'game', value: gkey },
        },
        refetchQueries: [
          {
            query: GET_GAME_QUERY,
            variables: {
              gkey: gkey,
            },
          },
        ],
        awaitRefetchQueries: true,
      });
      if (error) throw error;
    } catch (e) {
      console.log('error removing round from game', e);
    }
  };

  return <Icon name="remove-circle" color="red" onPress={() => _removePlayer()} />;
};

export default RemovePlayer;
