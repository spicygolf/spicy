
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

import { Actions } from 'react-native-router-flux';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { connect } from 'react-redux';

import {
  setCurrentRound
} from 'features/rounds/roundActions';


// TODO: supply course details
const courseHoles = [
  [ '1',  '2',  '3',  '4',  '5',  '6',  '7',  '8',  '9'],
  ['10', '11', '12', '13', '14', '15', '16', '17', '18']
];

class BirdieEmAllLeaderboard extends React.Component {

  constructor(props) {
    super(props);
    this._renderScoreItem = this._renderScoreItem.bind(this);
  }

  _scoreTeam(data) {
    var total = 0;
    var holes = [];
    data.map(({hole, values}) => {
      values.map(value => {
        if( value.k === 'birdie' && value.v === 'true' ) {
          total += 1;
          holes.push(hole);
        }
      });
    });
    return {total: total, holes: holes};
  }

  _score(data) {
    // get team/player scores from scoring function
    var scores = data.map((score) => {
      return {
        player: score.player,
        round: score._key,
        score: this._scoreTeam(score.scores)
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

  _itemPressed(item, courseHoles) {
    const {player, round} = item;
    this.props.setCurrentRound({round_id: round});
    Actions.score({
      currentGame: this.props.currentGame,
      player: player,
      round_id: round,
      courseHoles: courseHoles
    });
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
            onPress={() => this._itemPressed(item, courseHoles)}
          >
            <Icon name='lead-pencil' size={25} color='#666' />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  render() {
    var scores = this._score(this.props.roundsPlayers);

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

const mapState = (state) => {
  return {};
};

const actions = {
  setCurrentRound: setCurrentRound
};

export default connect(mapState, actions)(BirdieEmAllLeaderboard);


/**
 * ## Styles
 */
var styles = StyleSheet.create({
  LeaderboardContainer: {
    marginTop: 0
  },
  ScoreItemContainer: {
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
    fontSize: 25,
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
