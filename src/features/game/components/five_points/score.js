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
import { get_round_for_player } from 'common/utils/rounds';



class FivePointsScore extends React.Component {

  constructor(props) {
    super(props);
    console.log('5pts Score - game', props.screenProps.game);
    this.state = {
      gamespec: { team_size: 2, max_players: 4 }, // TODO: fetch this from game setup / db
      game: props.screenProps.game,
      currentHole: props.screenProps.currentHole || '1'
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
    if( item && item.name ) {
      const index = (item && item.handicap && item.handicap.display) ?
        item.handicap.display : null;
      const round = get_round_for_player(this.state.game.rounds, item._key);
      const handicap = round.game_handicap ?
        round.game_handicap : round.course_handicap;

      return (
        <ListItem
          key={item._key}
          title={item.name || ''}
          subtitle={handicap || 'NH'}
        />
      );
    } else {
      return null;
    }
  }

  render() {

    const { game, gamespec } = this.state;

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

    return (
      <View>
        <HoleNav
          holes={this.state.game.tees[0].holes}
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
