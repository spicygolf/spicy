'use strict';

import { ToggleHole } from 'common/components/toggle_hole';
import { upsertScore } from 'common/utils/upsertScore';
import GameNav from 'features/games/gamenav';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const BirdieEmAllScore = (props) => {
  const { player, round_id, score, courseHoles } = props;

  return (
    <View>
      <GameNav title={player.name} showBack={true} showScore={false} />
      <View style={styles.cardContainer}>
        <View style={styles.ninesContainer}>
          {courseHoles.map((nine, i) => (
            <View key={i} style={styles.nine}>
              {nine.map((hole) => {
                const gotit = score.holes.indexOf(hole) >= 0;
                return (
                  <ToggleHole
                    key={hole}
                    round_id={round_id}
                    hole={hole}
                    type="birdie"
                    gotit={gotit}
                    updateCache={(scores) => {
                      const ns = upsertScore(scores, hole, 'birdie', !gotit);
                      // TODO: affect change in leaderboard props or state?
                      return ns;
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default BirdieEmAllScore;

var styles = StyleSheet.create({
  cardContainer: {
    padding: 15,
  },
  ninesContainer: {
    alignItems: 'center',
  },
  nine: {
    flexDirection: 'row',
    paddingBottom: 10,
  },
});
