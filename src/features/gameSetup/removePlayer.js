import React from 'react';
import { Icon } from 'react-native-elements';
import { useMutation } from 'react-apollo';

import { REMOVE_LINK_MUTATION } from 'common/graphql/unlink';
import { GET_GAME_QUERY } from 'features/games/graphql';



const RemovePlayer = props => {

  const { pkey, gkey, rkey } = props;
  const [ unlink ] = useMutation(REMOVE_LINK_MUTATION);

  const _removePlayer = () => {
    _removePlayer2Game();
    _removeRound2Game();
  };

  const _removePlayer2Game = () => {
    // remove player2game link
    const { loading, data, error } = unlink({
      variables: {
        from: {type: 'player', value: pkey},
        to: {type: 'game', value: gkey}
      },
      refetchQueries: [{
        query: GET_GAME_QUERY,
        variables: {
          gkey: gkey
        }
      }],
      awaitRefetchQueries: true,
    });
    if( error ) {
      console.log('error removing player from game', error);
    }
  };

  const _removeRound2Game = () => {
    const { loading, data, error } = unlink({
      variables: {
        from: {type: 'round', value: rkey},
        to: {type: 'game', value: gkey}
      },
      refetchQueries: [{
        query: GET_GAME_QUERY,
        variables: {
          gkey: gkey
        }
      }],
      awaitRefetchQueries: true,
    });
    if( error ) {
      console.log('error unlinking round from game', error);
    }
  };


  return (
    <Icon
      name='remove-circle'
      color='red'
      onPress={() => _removePlayer()}
    />
  );

};

export default RemovePlayer;