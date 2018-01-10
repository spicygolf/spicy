'use strict';

/**
 * ## Imports
 *
*/
import React from 'react';

import
{
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { List, ListItem } from 'react-native-elements';

import {
  Actions
} from 'react-native-router-flux';

import Icon from '@expo/vector-icons/MaterialCommunityIcons';

/**
 * ## Styles
 */
var styles = StyleSheet.create({
  LeaderboardContainer: {
    marginTop: 0
  },
  ScoreItemContainer: {
    flex: 2,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#aaa'
  },
  ScoreItemCell: {
    padding: 5
  },
  LeftCell: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 10
  },
  MiddleCell: {
    flex: 9
  },
  RightCell: {
    flex: 1,
    justifyContent: 'center'
  },
  Total: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'right'
  },
  Player: {
    fontWeight: 'bold'
  },
  nine: {
    flexDirection: 'row',
    flex: 9
  },
  holeContainer: {
    flex: 9
  },
  hole: {
    paddingRight: 2,
    minWidth: 28
  },
  holeText: {
    textAlign: 'right'
  },
  yes: {
    color: '#000',
    fontWeight: 'bold'
  },
  no: {
    color: '#bbb'
  }

});

// TODO: supply course details
const courseHoles = [
  [ '1',  '2',  '3',  '4',  '5',  '6',  '7',  '8',  '9'],
  ['10', '11', '12', '13', '14', '15', '16', '17', '18']
];

/**
 * ### Class
 */
class Leaderboard extends React.Component {

  _scoreTeam(data) {
    var total = 0;
    var holes = [];
    Object.entries(data).forEach(([hole, score]) => {
      if( score.birdie === true ) {
        total += 1;
        holes.push(hole);
      }
    });
    return {total: total, holes: holes};
  }

  _score(data) {
    // get team/player scores from scoring function
    var scores = data.map((score) => {
      return {
        player: score.players[0].player,
        round: score.players[0].round,
        score: this._scoreTeam(score.scores[0])
      };
    });

    // sort on score object total value
    scores.sort((a, b) => {
      if( a.score.total < b.score.total ) return  1;
      if( a.score.total > b.score.total ) return -1;
      return 0;
    });

    return scores;
  }

  _renderScoreItem({item}) {
    var holes = (
      <View style={styles.holeContainer}>
        {courseHoles.map((nine, i) => (
          <View key={i} style={styles.nine}>
            {nine.map((hole) => {
              var gotit = item.score.holes.includes(hole) ?
                styles.yes : styles.no;
              return (
                <View key={hole} style={styles.hole}>
                  <Text style={[styles.holeText, gotit]}>{hole}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );

    return (
      <View style={styles.ScoreItemContainer}>
        <View style={[styles.ScoreItemCell, styles.LeftCell]}>
          <Text style={styles.Total}>{item.score.total}</Text>
        </View>
        <View style={[styles.ScoreItemCell, styles.MiddleCell]}>
          <View>
            <Text style={styles.Player}>{item.player.name}</Text>
          </View>
          {holes}
        </View>
        <View style={[styles.ScoreItemCell, styles.RightCell]}>
          <TouchableOpacity
            onPress={() => Actions.score({
                player: item.player,
                round: item.round,
                scores: item.scores
              })}
          >
            <Icon name='lead-pencil' size={25} color='#666' />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  render() {

    var scores = this._score(this.props.scores);

    return (
      <List
        containerStyle={styles.LeaderboardContainer}>
        <FlatList
          data={scores}
          renderItem={this._renderScoreItem}
          keyExtractor={item => item.player.short}
        />
      </List>
    );
  }
}

export default Leaderboard;
