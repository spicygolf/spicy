'use strict';

import React from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';

import { Icon } from 'react-native-elements';

import { findIndex, sortBy } from 'lodash';



const sortHoles = h => {
  let ret = null;
  // try to use sequence first
  if( h.seq ) ret = parseInt(h.seq);
  if( Number.isInteger(ret) ) return ret;
  // fall back to hole
  ret = parseInt(h.hole);
  if( Number.isInteger(ret) ) return ret;
  // didn't find any sortable seq or hole, so punt by returning 0
  return 0;
};


const HoleNav = ({holes:holesOrig, currentHole, changeHole}) => {

  const holes = sortBy(holesOrig, sortHoles);
  const currentHoleIndex = findIndex(holes, h => { return h.hole == currentHole })

  return (
    <View style={styles.container}>
      <View style={styles.direction}>
        <Icon
          name='chevron-left'
          size={40}
          onPress={() => {
            let newHoleIndex = currentHoleIndex - 1;
            if( newHoleIndex < 0 ) newHoleIndex = holes.length - 1;
            changeHole(holes[newHoleIndex].hole);
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
          changeHole(holes[newHoleIndex].hole);
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