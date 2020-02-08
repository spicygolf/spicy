import React, { useContext } from 'react';

import {
  ListItem
} from 'react-native-elements';

import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@apollo/react-hooks';

import { GameContext } from 'features/game/gameContext';
import { AddCourseContext } from 'features/gameSetup/addCourseContext';
import { ADD_LINK_MUTATION } from 'common/graphql/link';
import { REMOVE_LINK_MUTATION } from 'common/graphql/unlink';
import { GET_GAME_QUERY } from 'features/games/graphql';
import FavoriteIcon from 'common/components/favoriteIcon';
import { get_round_for_player } from 'common/utils/rounds';
import { calc_course_handicaps } from 'common/utils/handicap';



const Tee = props => {

  const navigation = useNavigation();
  const { game } = useContext(GameContext);
  const { rkey, oldTee } = useContext(AddCourseContext);

  const [ linkRoundToTee ] = useMutation(ADD_LINK_MUTATION);
  const [ unlinkRoundToTee ] = useMutation(REMOVE_LINK_MUTATION);

  const { item, title, subtitle } = props;

  const assigned = oldTee ? "manual" : "first";

  const add = (rkey, tkey, other) => {
    const { loading, error, data } = linkRoundToTee({
      variables: {
        from: {type: 'round', value: rkey},
        to: {type: 'tee', value: tkey},
        other: other,
      },
      refetchQueries: () => [{
        query: GET_GAME_QUERY,
        variables: {
          gkey: game._key
        }
      }],
      awaitRefetchQueries: true,
    });
    if( error ) {
      console.log('error adding tee to round', error);
    }
  };


  const rm = (rkey, tkey) => {
    const { loading, error, data } = unlinkRoundToTee({
      variables: {
        from: {type: 'round', value: rkey},
        to: {type: 'tee', value: tkey},
      },
      refetchQueries: () => [{
        query: GET_GAME_QUERY,
        variables: {
          gkey: game._key
        }
      }],
      awaitRefetchQueries: true,
    });
    if( error ) {
      console.log('error removing tee to round', error);
    }
  };

  return (
    <ListItem
      title={title}
      subtitle={subtitle}
      onPress={() => {
        if( oldTee ) {
          // we need to remove this edge and replace with new one
          rm(rkey, oldTee._key);
        }

        add(rkey, item._key, [{key: "assigned", value: assigned}]);

        // add the same tee to the other players' rounds in this
        // game, unless they have round2tee already.
        game.rounds.map(round => {
          if( !round.tee ) {
            add(round._key, item._key, [{key: "assigned", value: "auto"}]);
          }
        });

        // here is one place we can calculate the course_handicap
        // on the round2game edges
        // TODO: enable me
        //calc_course_handicaps(gkey);

        // after all that, go back to GameSetup
        navigation.navigate('GameSetup');
      }}
      leftIcon={(
        <FavoriteIcon
          fave={item.fave}
        />
      )}
    />
  );

};

export default Tee;
