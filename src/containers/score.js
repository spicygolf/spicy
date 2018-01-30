'use strict';

import React from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { connect } from 'react-redux';

import { baseUrl } from '../lib/config';

import GameNav from '../components/gamenav';

import { roundSelector } from '../state/lib/selectors';

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



class Score extends React.Component {

  constructor(props) {
    super(props);
    this.scorecard = this.scorecard.bind(this);
  }

  scorecard() {

    const { player, round_id, courseHoles } = this.props;
    const r = this.props.round;

    return (
      <View style={styles.ninesContainer}>
        {
          courseHoles.map((nine, i) => (
            <View key={i} style={styles.nine}>
              {
                nine.map((hole) => {
                  var gotit = r.scores[hole] && r.scores[hole].birdie === true;
                  var gotitStyle = gotit ? styles.yes : styles.no;
                  var gotitTextStyle = gotit ? styles.yesText : styles.noText;

                  return (
                    <View key={hole} style={[styles.hole, gotitStyle]}>
                      <TouchableOpacity
                        onPress={() => this.props.postScore({
                                  round: round_id,
                                  hole: hole,
                                  values: {
                                    birdie: !gotit
                                  }
                                })}
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

    const { player } = this.props;

    var scorecard = this.props ? this.scorecard() : {};

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

function mapStateToProps(state) {
  return {
    round: roundSelector(state),
    currentRound: state.currentRound
  };
}

export default connect(mapStateToProps)(Score);
