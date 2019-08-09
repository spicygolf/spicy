
import React from 'react';

import
{
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { Query, withApollo } from 'react-apollo';
import { GET_GAME_QUERY } from 'features/games/graphql';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';


class FivePointsLeaderboard extends React.Component {

  constructor(props) {
    super(props);
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
    if( !data ) return [];
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
    const { player, round, score } = item;
    this.props.navigation.navigate('Score', {
      currentGame: this.props.currentGame,
      player: player[0],
      round_id: round,
      score: score,
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
            <Text style={styles.Player}>{item.player[0].name}</Text>
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

  componentDidUpdate(prev_props) {
      console.log('cDU prev_props', prev_props);
      console.log('cDU props', this.props);
  }

  render() {
    return (
      <View style={styles.LeaderboardContainer}>
        <Text>FivePoints Leaderboard</Text>
      </View>
    );
  }

  /*
  render() {
    return (
      <Query
        query={GET_GAME_QUERY}
        variables={{game: this.props.currentGame._key}}
      >
        {({ loading, error, data, client }) => {
          if( loading ) {
            //console.log('get game query, loading - data:', data, loading);
            return (<ActivityIndicator />);
          }
          if( error ) {
            console.log(error);
            return (<Text>Error</Text>);
          }
          if( data && data.getGame && data.getGame.rounds ) {
            let scores = this._score(data.getGame.rounds);

            return (
              <View style={styles.LeaderboardContainer}>
                <FlatList
                  data={scores}
                  renderItem={this._renderScoreItem}
                  keyExtractor={item => item.player[0].short}
                  ListFooterComponent={<View style={styles.ListFooter}></View>}
              />
              </View>
            );
          } else {
            return (<Text>Error, no scores</Text>);
          }
          return;
        }}
      </Query>
    );
  }
  */
}

export default withApollo(FivePointsLeaderboard);


/**
 * ## Styles
 */
var styles = StyleSheet.create({
  LeaderboardContainer: {
    marginTop: 0
  },
  ListFooter: {
    height: 0,
    marginBottom: 90
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
