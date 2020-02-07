import React from 'react';

import {
  ListItem
} from 'react-native-elements';

import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@apollo/react-hooks';

import { ADD_LINK_MUTATION } from 'common/graphql/link';
import { GET_GAME_QUERY } from 'features/games/graphql';
import FavoriteIcon from 'common/components/favoriteIcon';



const Player = props => {

  const navigation = useNavigation();
  const [ link ] = useMutation(ADD_LINK_MUTATION);

  const { game } = useContext(GameContext);
  const { _key:gkey, start:game_start } = game;

  const { team, item, title, subtitle } = this.props;
  const pkey = item._key;

  let others = [];
  if( team ) others.push({key: 'team', value: team});

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
        navigation.navigate('LinkRound', {
          game_start: game_start,
          pkey: pkey,
          player: item,
          gkey: gkey
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
