'use strict';

import React from 'react';

import {
  StyleSheet,
  View
} from 'react-native';

import Header from 'common/components/header';


import { blue } from 'common/colors';

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
