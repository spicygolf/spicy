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
    console.log('5pts Score game', props.screenProps.game);
  }

  render() {
    const holes = [];
    const currentHole = '1';

    return (
      <View>
        <HoleNav
          holes={holes}
          currentHole={currentHole}
        />
        <Text>FivePoints Score</Text>
      </View>
    );
  }
}

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
