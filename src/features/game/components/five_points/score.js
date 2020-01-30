'use strict';

import React from 'react';
import {
  StyleSheet,
  View
} from 'react-native';

import {
  ListItem
} from 'react-native-elements';


import { getTeams } from 'common/utils/teams';
import HoleNav from 'features/game/holenav';
import Teams from 'features/games/teams';
import { GameContext } from 'features/game/gamecontext';
import { get_round_for_player } from 'common/utils/rounds';



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
    if( item && item.name ) {
      const index = (item && item.handicap && item.handicap.display) ?
        item.handicap.display : null;
      const round = get_round_for_player(game.rounds, item._key);
      let handicap = 'NH';

      if( round ) {
        handicap = round.game_handicap ?
          round.game_handicap : round.course_handicap;
        handicap = handicap ? handicap.toString() : 'NH';
      }

      return (
        <ListItem
          key={item._key}
          title={item.name || ''}
          subtitle={handicap}
        />
      );
    } else {
      return null;
    }
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
      <View>
        <HoleNav
          holes={holes}
          currentHole={this.state.currentHole}
          changeHole={this.changeHole}
        />
        {content}
      </View>
    );
  }

};

export default FivePointsScore;




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
