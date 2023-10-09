import { useNavigation } from '@react-navigation/native';
import FavoriteIcon from 'common/components/favoriteIcon';
import { course_handicap } from 'common/utils/handicap';
import { GameContext } from 'features/game/gameContext';
import { GET_GAME_QUERY } from 'features/game/graphql';
import { AddCourseContext } from 'features/gameSetup/addCourseContext';
import { useAddTeeToRoundMutation } from 'features/rounds/hooks/useAddTeeToRoundMutation';
import { useRemoveTeeFromRoundMutation } from 'features/rounds/hooks/useRemoveTeeFromRoundMutation';
import { find } from 'lodash-es';
import React, { useContext } from 'react';
import { StyleSheet } from 'react-native';
import { Icon, ListItem } from 'react-native-elements';

const Tee = (props) => {
  const { tee, title, subtitle, showRemove } = props;

  const navigation = useNavigation();
  const { game } = useContext(GameContext);
  const { _key: gkey } = game;
  const { rkey } = useContext(AddCourseContext);

  const [addTeeToRound] = useAddTeeToRoundMutation();
  const [removeTeeFromRound] = useRemoveTeeFromRoundMutation();

  const selectTee = async () => {
    await add(rkey);

    // add the same tee to the other players' rounds in this game
    // if they don't have any tees assigned already
    game.rounds.map(async (round) => {
      if (!round || round._key === rkey) {
        return;
      }

      if (!round.tees) {
        await add(round._key);
      }
    });

    // after all that, go back to GameSetup
    navigation.navigate('GameSetup');
  };

  const add = async (roundKey) => {
    let ch = null;
    const round = find(game.rounds, { _key: roundKey });
    if (round?.player[0]?.handicap?.index) {
      const index = round.player[0].handicap.index;
      ch = course_handicap(index, tee, game.scope.holes);
    }
    const { error } = await addTeeToRound({
      variables: {
        rkey: roundKey,
        course_id: tee.course_id,
        tee_id: tee.tee_id,
        course_handicap: ch,
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

  const remove = async (roundKey) => {
    const { error } = await removeTeeFromRound({
      variables: {
        rkey: roundKey,
        tee_id: tee.tee_id,
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
      console.log('error removing tee from round', error);
    }
  };

  return (
    <ListItem
      onPress={selectTee}
      containerStyle={styles.listItemContainer}
      testID={`favorite_tee_${tee.tee_id}`}>
      <FavoriteIcon fave={tee.fave} />
      <ListItem.Content>
        <ListItem.Title>{title}</ListItem.Title>
        <ListItem.Subtitle style={styles.subtitle}>{subtitle}</ListItem.Subtitle>
      </ListItem.Content>
      {showRemove ? (
        <Icon
          name="remove-circle"
          color="red"
          onPress={async () => {
            await remove(rkey);
            navigation.navigate('GameSetup');
          }}
        />
      ) : null}
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
