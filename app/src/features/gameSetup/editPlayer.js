import { useMutation } from '@apollo/client';
import { blue } from 'common/colors';
import { UPDATE_LINK_MUTATION } from 'common/graphql/link';
import { course_handicap } from 'common/utils/handicap';
import { get_round_for_player } from 'common/utils/rounds';
import { GameContext } from 'features/game/gameContext';
import { query as getGameQuery } from 'features/game/hooks/useGetGameQuery';
import GameNav from 'features/games/gamenav';
import HandicapInput from 'features/gameSetup/handicapInput';
import React, { useContext } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Card } from 'react-native-elements';

const { width } = Dimensions.get('window');

const EditPlayer = (props) => {
  const { route } = props;
  const player =
    route && route.params && route.params.player ? route.params.player : null;
  const { _key: pkey } = player;

  const { game } = useContext(GameContext);
  const round = get_round_for_player(game.rounds, pkey);
  //console.log('EditPlayer round', round);

  const initHI = round?.handicap_index ? round.handicap_index.toString() : '';
  const initCH = round?.course_handicap ? round.course_handicap.toString() : '';
  const initGH = round?.game_handicap ? round.game_handicap.toString() : '';

  const [updateLink] = useMutation(UPDATE_LINK_MUTATION);

  // we store plus handicaps as negatives
  const storageValue = (v) => {
    // handle case when v is null, or only '+' or '.'
    if (!v || v === '+' || v === '.') {
      return '';
    }
    try {
      v = v.toString().replace('+', '-');
    } catch (e) {
      console.error(e);
    }
    return v;
  };

  const updateHI = (v) => {
    const ch = course_handicap(v, round.tee, game.scope.holes);
    const other = [
      { key: 'handicap_index', value: storageValue(v) },
      { key: 'course_handicap', value: storageValue(ch) },
      { key: 'game_handicap', value: storageValue(initGH) },
    ];
    update(other);
  };

  const updateGH = (v) => {
    const other = [
      { key: 'handicap_index', value: storageValue(initHI) },
      { key: 'course_handicap', value: storageValue(initCH) },
      { key: 'game_handicap', value: storageValue(v) },
    ];
    update(other);
  };

  const update = (other) => {
    // console.log('update other', other);
    // update 'round2game' edge with these two handicaps on them
    const { error } = updateLink({
      variables: {
        from: { type: 'round', value: round._key },
        to: { type: 'game', value: game._key },
        other: other,
      },
      refetchQueries: () => [
        {
          query: getGameQuery,
          variables: {
            gkey: game._key,
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
    <View>
      <GameNav title={player.name} showBack={true} backTo={'GameSetup'} />
      <KeyboardAvoidingView style={styles.scrollview_container}>
        <ScrollView>
          <Card>
            <Card.Title>Handicap</Card.Title>
            <Card.Divider />
            <HandicapInput
              label="Handicap Index"
              init={initHI}
              update={updateHI}
              showCourse="true"
              tee={round.tee}
              holes={game.scope.holes}
            />
            <View style={styles.divider}>
              <View style={styles.hrLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.hrLine} />
            </View>
            <HandicapInput
              label="Game Handicap"
              init={initGH}
              update={updateGH}
              showCourse="false"
            />
            <Text style={styles.label}>
              Full course handicap that overrides numbers above
            </Text>
          </Card>
          <Card>
            <Card.Title>Round</Card.Title>
            <Card.Divider />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default EditPlayer;

const styles = StyleSheet.create({
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  dividerText: {
    color: blue,
    textAlign: 'center',
    width: width / 8,
  },
  hrLine: {
    backgroundColor: blue,
    height: 1,
    width: width / 3.5,
  },
  label: {
    color: '#999',
    fontSize: 12,
    fontWeight: 'normal',
  },
  scrollview_container: {
    height: '100%',
  },
});
