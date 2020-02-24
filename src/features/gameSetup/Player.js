import React, { useContext } from 'react';

import {
  ListItem
} from 'react-native-elements';

import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@apollo/react-hooks';

import { GameContext } from 'features/game/gameContext';
import { ADD_LINK_MUTATION } from 'common/graphql/link';
import { GET_GAME_QUERY } from 'features/games/graphql';
import FavoriteIcon from 'common/components/favoriteIcon';



const Player = props => {

  const navigation = useNavigation();
  const [ link ] = useMutation(ADD_LINK_MUTATION);

  const { game } = useContext(GameContext);
  const { _key:gkey } = game;

  const { item, title, subtitle } = props;
  const pkey = item._key;

  let others = [];

  return (
    <ListItem
      title={title}
      subtitle={subtitle}
      onPress={() => {
        // link player to game
        const { loading, error, data } = link({
          variables: {
            from: {type: 'player', value: pkey},
            to: {type: 'game', value: gkey},
            other: others
          },
          refetchQueries: () => [{
            query: GET_GAME_QUERY,
            variables: {
              gkey: gkey
            }
          }],
          awaitRefetchQueries: true
        });
        if( error ) {
          console.log('error adding player to game', error);
        }
        // setup round for player
        //console.log('Issue #21 - Player on its way to LinkRound', item);
        navigation.navigate('LinkRound', {
          player: item,
        });
      }}
      leftIcon={(
        <FavoriteIcon
          fave={item.fave}
        />
      )}
    />
  );

};

export default Player;
