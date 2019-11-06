'use strict';

import React from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';

import HoleNav from 'features/game/holenav';



class FivePointsScore extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      game: props.screenProps.game,
      currentHole: props.screenProps.currentHole || '1'
    };
    this.changeHole = this.changeHole.bind(this);
  }

  changeHole(newHole) {
    this.setState({
      currentHole: newHole
    });
  }

  render() {

    return (
      <View>
        <HoleNav
          holes={this.state.game.tees[0].holes}
          currentHole={this.state.currentHole}
          changeHole={this.changeHole}
        />
        <Text>FivePoints Score for {this.state.currentHole}</Text>
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
