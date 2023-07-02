import { useMutation } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import FavoriteIcon from 'common/components/favoriteIcon';
import { ADD_LINK_MUTATION, UPDATE_LINK_MUTATION } from 'common/graphql/link';
import { REMOVE_LINK_MUTATION } from 'common/graphql/unlink';
import { GameContext } from 'features/game/gameContext';
import { GET_GAME_QUERY } from 'features/game/graphql';
import { AddCourseContext } from 'features/gameSetup/addCourseContext';
import React, { useContext } from 'react';
import { StyleSheet } from 'react-native';
import { ListItem } from 'react-native-elements';

import { course_handicap } from '../../common/utils/handicap';

const Tee = (props) => {
  const navigation = useNavigation();
  const { game } = useContext(GameContext);
  const { _key: gkey } = game;
  const { rkey, oldTee } = useContext(AddCourseContext);

  const [linkRoundToTee] = useMutation(ADD_LINK_MUTATION);
  const [unlinkRoundToTee] = useMutation(REMOVE_LINK_MUTATION);
  const [updateLink] = useMutation(UPDATE_LINK_MUTATION);

  const { item, title, subtitle } = props;

  const assigned = oldTee ? 'manual' : 'first';

  const add = async (lRKey, tkey, other) => {
    const { error } = await linkRoundToTee({
      variables: {
        from: { type: 'round', value: lRKey },
        to: { type: 'tee', value: tkey },
        other: other,
      },
      refetchQueries: () => [
        {
          query: GET_GAME_QUERY,
          variables: {
            gkey: gkey,
          },
        },
      ],
      awaitRefetchQueries: true,
    });
    if (error) {
      console.log('error adding tee to round', error);
    }
  };

  const rm = async (lRKey, tkey) => {
    const { error } = await unlinkRoundToTee({
      variables: {
        from: { type: 'round', value: lRKey },
        to: { type: 'tee', value: tkey },
      },
      refetchQueries: () => [
        {
          query: GET_GAME_QUERY,
          variables: {
            gkey: gkey,
          },
        },
      ],
      awaitRefetchQueries: true,
    });
    if (error) {
      console.log('error removing tee to round', error);
    }
  };

  const update = async (lRKey, other) => {
    const { error } = await updateLink({
      variables: {
        from: { type: 'round', value: lRKey },
        to: { type: 'game', value: gkey },
        other: other,
      },
      refetchQueries: () => [
        {
          query: GET_GAME_QUERY,
          variables: {
            gkey: gkey,
          },
        },
      ],
      awaitRefetchQueries: true,
    });
    if (error) {
      console.log('error updating round2game', error);
    }
  };

  return (
    <ListItem
      onPress={async () => {
        if (oldTee) {
          // we need to remove this edge and replace with new one
          await rm(rkey, oldTee._key);
        }

        await add(rkey, item._key, [{ key: 'assigned', value: assigned }]);

        // add the same tee to the other players' rounds in this
        // game, unless they have round2tee already.
        game.rounds.map(async (round) => {
          //console.log('looping through rounds after tee selection', round);
          if (!round) {
            return;
          } // odd edge case during development /shrug
          if (!round.tee) {
            await add(round._key, item._key, [{ key: 'assigned', value: 'auto' }]);
          }

          // here is one place we can calculate the course_handicap
          // on the round2game edges
          if (
            round &&
            round.player &&
            round.player[0] &&
            round.player[0].handicap &&
            round.player[0].handicap.index
          ) {
            const index = round.player[0].handicap.index;
            //console.log('index', index)

            // tee is 'item' if it's the one being changed
            // otherwise, it's round.tee
            const tee = round.tee ? round.tee : item;

            const ch = course_handicap(index, tee, game.scope.holes);
            //console.log('ch', ch);
            if (ch && ch !== round.course_handicap) {
              //console.log('updating course_handicap to ', ch);
              await update(round._key, [
                { key: 'handicap_index', value: index.toString() },
                { key: 'course_handicap', value: ch.toString() },
              ]);
            }
          }
        });

        // after all that, go back to GameSetup
        navigation.navigate('GameSetup');
      }}
      containerStyle={styles.listItemContainer}
      testID={`favorite_tee_${item._key}`}>
      <FavoriteIcon fave={item.fave} />
      <ListItem.Content>
        <ListItem.Title>{title}</ListItem.Title>
        <ListItem.Subtitle style={styles.subtitle}>{subtitle}</ListItem.Subtitle>
      </ListItem.Content>
    </ListItem>
  );
};

export default Tee;

const styles = StyleSheet.create({
  subtitle: {
    color: '#999',
    fontSize: 12,
  },
  listItemContainer: {
    marginHorizontal: 0,
    paddingHorizontal: 5,
    paddingVertical: 4,
  },
});
