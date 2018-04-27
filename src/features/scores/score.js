'use strict';

import React from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { connect } from 'react-redux';
import { find } from 'lodash';

import { baseUrl } from 'common/config';

import GameNav from 'features/games/gamenav';
import { selectRound } from 'features/rounds/roundSelectors';
import { postScore } from 'features/rounds/roundActions';


class Score extends React.Component {

  constructor(props) {
    super(props);
    this.scorecard = this.scorecard.bind(this);
  }

  _itemPress(round_id, hole, gotit) {
    const v = String(!gotit);
    this.props.postScore({
      round_id: round_id,
      hole: hole,
      values: [{ k: 'birdie', v: v }]
    });
  }

  _gotBirdie(hole, scores) {
    var h = find(scores, {hole: hole});
    if( !h ) return false;
    var b = find(h.values, {k: 'birdie', v: 'true'});
    if( !b ) return false;
    return true;
  }

  scorecard(player, round, courseHoles) {
    console.log('score.js round', round);
    return (
      <View style={styles.ninesContainer}>
        {
          courseHoles.map((nine, i) => (
            <View key={i} style={styles.nine}>
              {
                nine.map((hole) => {
                  var gotit = this._gotBirdie(hole, round.scores);
                  var gotitStyle = gotit ? styles.yes : styles.no;
                  var gotitTextStyle = gotit ? styles.yesText : styles.noText;

                  return (
                    <View key={hole} style={[styles.hole, gotitStyle]}>
                      <TouchableOpacity
                        onPress={() => this._itemPress(round._key, hole, gotit)}
                      >
                        <Text style={[styles.holeText, gotitTextStyle]}>{hole}</Text>
                      </TouchableOpacity>
                    </View>
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

    const { player, round, courseHoles } = this.props;

    var scorecard = this.scorecard(player, round, courseHoles);

    return (
      <View>
        <GameNav
          title={player.name}
          showBack={true}
          showScore={false}
        />
        <View style={styles.cardContainer}>
          {scorecard}
        </View>
      </View>
    );
  }
};

const mapState = (state) => {
  return {
    round: selectRound(state)
  };
};

const actions = {
  postScore: postScore
};

export default connect(mapState, actions)(Score);




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
  },
  hole: {
    margin: 3,
    flex: 1
  },
  yes: {
    borderColor: '#000',
    borderWidth: 2
  },
  no: {
    borderColor: '#aaa',
    borderWidth: 1
  },
  holeText: {
    textAlign: 'center',
    fontSize: 20
  },
  yesText: {
    color: '#000',
    fontWeight: 'bold'
  },
  noText: {
    color: "#aaa"
  }
});
