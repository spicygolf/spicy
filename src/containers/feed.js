'use strict';

import React from 'react';

import {
  StyleSheet,
  View
} from 'react-native';

import Header from '../components/header';


import { blue } from '../lib/colors';

/**
 * ## Styles
 */
var styles = StyleSheet.create({
  container: {
    flex: 1
  }
});


class Feed extends React.Component {

  render() {
    return (
      <View style={styles.container}>
        <Header title='Feed' color={blue} />
      </View>
    );
  }
};

export default Feed;
