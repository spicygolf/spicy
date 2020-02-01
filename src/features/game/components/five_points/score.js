import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getTeams } from 'common/utils/teams';
import HoleScore from 'common/components/holeScore';
import HoleNav from 'features/game/holenav';
import Teams from 'features/games/teams';
import { GameContext } from 'features/game/gamecontext';
import {
  get_gross,
  get_hole,
  get_round_for_player,
  get_score,
} from 'common/utils/rounds';



class FivePointsScore extends React.Component {

  static contextType = GameContext;

  constructor(props) {
    super(props);
    this.state = {
      currentHole: props.currentHole || '1'
    };
    this.changeHole = this.changeHole.bind(this);
    this._renderPlayer = this._renderPlayer.bind(this);
  }

  // TODO: candidate for a base class?
  changeHole(newHole) {
    this.setState({
      currentHole: newHole
    });
  }

  _renderPlayer({item}) {
    const { game } = this.context;
    const { currentHole } = this.state;
    const round = get_round_for_player(game.rounds, item._key);

    const hole = get_hole(currentHole, round);

    let handicap = 'NH';
    const index = (item && item.handicap && item.handicap.display) ?
      item.handicap.display : null;
    if( round ) {
      handicap = round.game_handicap ?
        round.game_handicap : round.course_handicap;
      handicap = handicap ? handicap.toString() : 'NH';
    }

    let gross = null;
    const score = get_score(currentHole, round);
    if( score  ) {
      gross = get_gross(score);
    }

    return (
      <View style={styles.player_score_container}>
        <View style={styles.player_name}>
          <Text>{item.name || ''}</Text>
          <Text>{handicap}</Text>
        </View>
        <View style={styles.hole_score}>
          <HoleScore
            hole={hole}
            gross={gross}
          />
        </View>
      </View>
    );

  }

  render() {

    const { game, gamespec } = this.context;

    let content = null;
    if( gamespec.team_size && gamespec.team_size > 1 ) {
      const teams = getTeams(game.players, gamespec);
      //console.log('teams', teams);
      content = (
        <Teams
          teams={teams}
          players={game.players}
          gamespec={gamespec}
          renderPlayer={this._renderPlayer}
        />
      );
    } else {
      content = (
        <FlatList
          data={game.players}
          renderItem={this._renderPlayer}
          keyExtractor={item => item._key}
        />
      );
    }

    // TODO: get 9 or 18 from game / gameSetup somehow
    const holes = Array.from(Array(18).keys()).map(x => ++x);

    return (
      <View style={styles.score_container}>
        <HoleNav
          holes={holes}
          currentHole={this.state.currentHole}
          changeHole={this.changeHole}
        />
        <View style={styles.content_container}>
          {content}
        </View>
      </View>
    );
  }

};

export default FivePointsScore;




var styles = StyleSheet.create({
  score_container: {
    padding: 5,
  },
  content_container: {
    paddingTop: 15,
  },
  player_score_container: {
    padding: 15,
    flexDirection: 'row',
    flex: 2,
  },
  player_name: {
    flex: 1,
  },
  hole_score: {
    flex: 1,
  },
});
