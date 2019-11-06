'use strict';

import React from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';

import HoleNav from 'features/game/holenav';



const FivePointsScore = (props) => {


  const game = props.screenProps.game;
  const currentHole = props.screenProps.currentHole || '1';

  console.log('5pts - Score - game: ', game);

  return (
    <View>
      <HoleNav
        holes={game.tees[0].holes}
        currentHole={currentHole}
      />
      <Text>FivePoints Score</Text>
    </View>
  );

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
