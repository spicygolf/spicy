import { useMutation } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import FavoriteIcon from 'common/components/favoriteIcon';
import { GameContext } from 'features/game/gameContext';
import { GET_GAME_QUERY } from 'features/game/graphql';
import { AddCourseContext } from 'features/gameSetup/addCourseContext';
import { ADD_TEE_TO_ROUND_MUTATION } from 'features/rounds/graphql';
import React, { useContext } from 'react';
import { StyleSheet } from 'react-native';
import { ListItem } from 'react-native-elements';

// import { course_handicap } from '../../common/utils/handicap';

const Tee = (props) => {
  const { item, title, subtitle } = props;

  const navigation = useNavigation();
  const { game } = useContext(GameContext);
  const { _key: gkey } = game;
  const { rkey } = useContext(AddCourseContext);

  const [addTeeToRound] = useMutation(ADD_TEE_TO_ROUND_MUTATION);

  const add = async (roundKey) => {
    const { error } = await addTeeToRound({
      variables: {
        rkey: roundKey,
        course_id: item.course_id,
        tee_id: item.tee_id,
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

  return (
    <ListItem
      onPress={async () => {
        await add(rkey);

        // add the same tee to the other players' rounds in this game
        game.rounds.map(async (round) => {
          // console.log('round map', round);
          if (!round || round._key === rkey) {
            return;
          }

          if (!round.tees) {
            await add(round._key);
          }

          // // here is one place we can calculate the course_handicap
          // // on the round2game edges
          // if (
          //   round &&
          //   round.player &&
          //   round.player[0] &&
          //   round.player[0].handicap &&
          //   round.player[0].handicap.index
          // ) {
          //   const index = round.player[0].handicap.index;
          //   //console.log('index', index)

          //   // tee is 'item' if it's the one being changed
          //   // otherwise, it's round.tee
          //   const tee = round.tee ? round.tee : item;

          //   const ch = course_handicap(index, tee, game.scope.holes);
          //   //console.log('ch', ch);
          //   if (ch && ch !== round.course_handicap) {
          //     //console.log('updating course_handicap to ', ch);
          //     await update(round._key, [
          //       { key: 'handicap_index', value: index.toString() },
          //       { key: 'course_handicap', value: ch.toString() },
          //     ]);
          //   }
          // }
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
