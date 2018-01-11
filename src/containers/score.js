'use strict';

import React from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { baseUrl } from '../lib/config';

import Header from '../components/header';
import GameNav from '../components/gamenav';

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

  async postScore(round, hole, value) {

    const url = baseUrl + '/round/' + round + '/scores';
    try {
      let response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hole: hole,
          birdie: value
        })
      });
      let responseJson = await response.json();
      console.log('postScore fetch response: ', responseJson);

      // TODO: reset this component or reset state in entire game container

    } catch(e) {
      // TODO: handle better in app ('disconnected' icon or notice)
      console.error(e);
    }
  }

  scorecard() {

    const { player, round, holes, courseHoles } = this.props;

    return (
      <View style={styles.ninesContainer}>
        {
          courseHoles.map((nine, i) => (
            <View key={i} style={styles.nine}>
              {
                nine.map((hole) => {
                  var gotit = holes.includes(hole);
                  var gotitStyle = gotit ? styles.yes : styles.no;
                  var gotitTextStyle = gotit ? styles.yesText : styles.noText;

                  return (
                    <View key={hole} style={[styles.hole, gotitStyle]}>
                      <TouchableOpacity
                        onPress={() => this.postScore(round, hole, !gotit)}
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

export default Score;
