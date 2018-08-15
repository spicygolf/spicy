'use strict';

import React from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Query, withApollo } from 'react-apollo';
import moment from 'moment';

import { ToggleHole } from 'common/components/toggle_hole';
import { upsertScore } from 'common/utils/upsertScore';
import GameNav from 'features/games/gamenav';
import { roundFragment } from 'features/rounds/graphql';


class BirdieEmAllScore extends React.Component {

  constructor(props) {
    super(props);
    this.scorecard = this.scorecard.bind(this);
  }

  scorecard() {
    const { player, round_id, score, courseHoles } = this.props;

    return (
      <View style={styles.ninesContainer}>
        {
          courseHoles.map((nine, i) => (
            <View key={i} style={styles.nine}>
              {
                nine.map(hole => {
                  const gotit = (score.holes.indexOf(hole) >= 0);
                  return (
                    <ToggleHole
                      key={hole}
                      round_id={round_id}
                      hole={hole}
                      type='birdie'
                      gotit={gotit}
                      updateCache={scores => {
                        const ns = upsertScore(scores, hole, 'birdie', !gotit);
                        // TODO: affect change in leaderboard props or state?
                        return ns;
                      }}
                    />
                  );
                })
              }
            </View>
          ))
        }
      </View>
    );
  }

  render() {
    const { player } = this.props;

    return (
      <View>
        <GameNav
          title={player.name}
          showBack={true}
          showScore={false}
        />
        <View style={styles.cardContainer}>
          {this.scorecard()}
        </View>
      </View>
    );
  }
};

export default withApollo(BirdieEmAllScore);




var styles = StyleSheet.create({
  cardContainer: {
    padding: 15
  },
  ninesContainer: {
    alignItems: 'center'
  },
  nine: {
    flexDirection: 'row',
    paddingBottom: 10
  }
});
