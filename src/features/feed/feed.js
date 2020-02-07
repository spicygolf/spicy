'use strict';

import React from 'react';

import {
  StyleSheet,
  View
} from 'react-native';

import Header from 'common/components/header';
import { blue } from 'common/colors';



const Feed = props => {

  return (
    <View style={styles.container}>
      <Header title='Feed' color={blue} />
    </View>
  );

};

export default Feed;


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
