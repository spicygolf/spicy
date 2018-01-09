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
  View
} from 'react-native';

import { List, ListItem } from 'react-native-elements';

/**
 * ## Styles
 */
var styles = StyleSheet.create({
  LeaderboardContainer: {
    marginTop: 0
  },
  ScoreItemContainer: {
    flex: 2,
    flexDirection: 'row'
  },
  ScoreItemCell: {
    padding: 5
  },
  LeftCell: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 10
  },
  RightCell: {
    flex: 10
  },
  Total: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'right'
  },
  Player: {
    fontWeight: 'bold'
  },
  Holes: {
    color: '#aaa'
  }

});


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
    var holes = item.score.holes.join(', ');

    return (
      <View style={styles.ScoreItemContainer}>
        <View style={[styles.ScoreItemCell, styles.LeftCell]}>
          <Text style={styles.Total}>{item.score.total}</Text>
        </View>
        <View style={[styles.ScoreItemCell, styles.RightCell]}>
          <View>
            <Text style={styles.Player}>{item.player.name}</Text>
          </View>
          <View>
            <Text style={styles.Holes}>{holes}</Text>
          </View>
        </View>
      </View>
    );
  }

  render () {

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
