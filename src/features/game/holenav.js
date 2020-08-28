'use strict';

import React from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';

import { Icon } from 'react-native-elements';

import { findIndex, sortBy } from 'lodash';



const sortNumber = (a, b) => (a - b);


const HoleNav = props => {

  const {holes:holesOrig, currentHole, changeHole} = props;

  const holes = holesOrig.sort(sortNumber);
  holes.push("Summary");
  const currentHoleIndex = findIndex(holes, h => { return h == currentHole })

  return (
    <View style={styles.container}>
      <View style={styles.direction}>
        <Icon
          name='chevron-left'
          size={40}
          onPress={() => {
            let newHoleIndex = currentHoleIndex - 1;
            if( newHoleIndex < 0 ) newHoleIndex = holes.length - 1;
            changeHole(holes[newHoleIndex].toString());
          }}
        />
      </View>
      <View style={styles.currentHole}>
        <Text style={styles.holeText}>{currentHole}</Text>
        </View>
      <View style={styles.direction}>
      <Icon
        name='chevron-right'
        size={40}
        onPress={() => {
          let newHoleIndex = currentHoleIndex + 1;
          if( newHoleIndex >= holes.length ) newHoleIndex = 0;
          changeHole(holes[newHoleIndex].toString());
        }}
      />
      </View>
    </View>
  );

}

export default HoleNav;


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  direction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  currentHole: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'center'
  },
  holeText: {
    fontSize: 20
  }
})