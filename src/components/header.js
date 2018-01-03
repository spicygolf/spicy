
/**
 * # Header.js
 *
*/
'use strict';

/**
 * ## Imports
 *
*/
import React from 'react';

import
{
  Platform,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { ifIphoneX } from 'react-native-iphone-x-helper'

const paddingTopIphoneX = ifIphoneX(14, 0);
//const paddingTopAndroid = Platform.OS === 'android' ? 20 : 0;

/**
 * ## Styles
 */
var styles = StyleSheet.create({
  header: {
    paddingTop: 20 + paddingTopIphoneX,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  }
});

/**
 * ### Class
 */
class Header extends React.Component {

  render () {
    const { title, color } = this.props;
    const bg = { backgroundColor: color };

    return (
      <View style={[styles.header, bg]}>
        <Text style={styles.title}>{title}</Text>
      </View>
    );
  }
}

export default Header;
