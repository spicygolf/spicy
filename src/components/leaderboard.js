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

import { baseUrl } from '../lib/config';

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

  constructor(props) {
    super(props);
    this.state = {
      scores: []
    };
  }

  async _fetchScores() {
    const url = baseUrl + '/game/'+this.props.game.id+'/scores';
    try {
      let response = await fetch(url);
      let responseJson = await response.json();
      this._updateData('scores', responseJson);
    } catch(error) {
      console.error(error);
    }
  }

  _updateData(type, data) {
    this.setState((prevState, props) => {
      prevState[type] = data;
      return prevState;
    });
  }

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
        player: score.players[0],
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


  componentWillMount() {
    this._fetchScores();
  }

  render () {
    var content;

    if( this.state && this.state.scores ) {
      var scores = this._score(this.state.scores);
      content = (
        <List
          containerStyle={styles.LeaderboardContainer}>
          <FlatList
            data={scores}
            renderItem={this._renderScoreItem}
            keyExtractor={item => item.player.short}
          />
        </List>
      );

    } else {
      content = (
        <Text>Loading...</Text>
      );
    }
    return (
      <View>
        {content}
      </View>
    );
  }
}

export default Leaderboard;
