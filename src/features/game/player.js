import { blue } from 'common/colors';
import HoleJunk from 'common/components/holeJunk';
import HoleScore from 'common/components/holeScore';
import { getWolfPlayerIndex } from 'common/utils/game';
import { get_hole, get_round_for_player, get_score } from 'common/utils/rounds';
import { GameContext } from 'features/game/gameContext';
import TeeSelector from 'features/gameSetup/teeSelector';
import React, { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const Player = (props) => {
  const { player, currentHole, test } = props;
  const { game, activeGameSpec } = useContext(GameContext);

  if (!player || !player._key) return null;
  const round = get_round_for_player(game.rounds, player._key);
  if (!round) return null;

  const { _key: rkey } = round;
  const hole = get_hole(currentHole, round);
  const score = get_score(currentHole, round);

  const wolfPlayerIndex = getWolfPlayerIndex({ game, currentHole });
  let wolfPKey = '';
  if (wolfPlayerIndex > -1) {
    wolfPKey = game.scope.wolf_order[wolfPlayerIndex];
  }
  const wolf =
    wolfPKey === player._key ? (
      <Text style={styles.wolf}>{activeGameSpec.wolf_disp}</Text>
    ) : null;

  const holeScore = hole ? (
    <HoleScore hole={hole} score={score} rkey={rkey} test={test} />
  ) : (
    <TeeSelector game={game} tee={round.tee} rkey={rkey} player={player} />
  );

  const holeJunk = hole ? (
    <HoleJunk hole={hole} score={score} pkey={player._key} test={test} />
  ) : null;

  return (
    <View style={styles.player_container}>
      <View style={styles.player_score_container}>
        <View style={styles.player_name}>
          <Text style={styles.player_name_txt}>{player.name || ''}</Text>
          {wolf}
        </View>
        <View style={styles.hole_score}>{holeScore}</View>
      </View>
      <View style={styles.player_junk_container}>{holeJunk}</View>
    </View>
  );
};

export default Player;

var styles = StyleSheet.create({
  player_container: {
    padding: 10,
  },
  player_score_container: {
    flexDirection: 'row',
    flex: 2,
  },
  player_junk_container: {
    paddingTop: 5,
    flex: 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  player_name: {
    flex: 1,
    justifyContent: 'center',
  },
  player_name_txt: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  wolf: {
    fontSize: 12,
    color: blue,
  },
  hole_score: {
    flex: 1,
  },
});
