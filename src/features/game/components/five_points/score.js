'use strict';

import React from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';



class FivePointsScore extends React.Component {


  constructor(props) {
    super(props);
    console.log('5pts Score props', props);
  }

  render() {
    return (
      <View>
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
