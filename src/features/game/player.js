import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import TeeSelector from 'features/gameSetup/teeSelector';
import HoleScore from 'common/components/holeScore';
import HoleJunk from 'common/components/holeJunk';
import {
  get_hole,
  get_round_for_player,
  get_score,
} from 'common/utils/rounds';



const Player = props => {

  const { player, game, currentHole, test } = props;

  if( !player || !player._key ) return null;
  const round = get_round_for_player(game.rounds, player._key);
  if( !round ) return null;

  const { _key: rkey } = round;
  const hole = get_hole(currentHole, round);
  const score = get_score(currentHole, round);

  const holeScore = hole ? (
    <HoleScore
      hole={hole}
      score={score}
      rkey={rkey}
      test={test}
    />
  ) : (
    <TeeSelector
      game={game}
      tee={round.tee}
      rkey={rkey}
      player={player}
    />
  );

  const holeJunk = hole ? (
    <HoleJunk
      hole={hole}
      score={score}
      pkey={player._key}
      test={test}
    />
  ) : null;

  return (
    <View style={styles.player_container}>
      <View style={styles.player_score_container}>
        <View style={styles.player_name}>
          <Text style={styles.player_name_txt}>{player.name || ''}</Text>
        </View>
        <View style={styles.hole_score}>
          {holeScore}
        </View>
      </View>
      <View style={styles.player_junk_container}>
        {holeJunk}
      </View>
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
  hole_score: {
    flex: 1,
  },
});
