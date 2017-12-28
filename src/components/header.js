
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
  StyleSheet,
  Text,
  View
} from 'react-native';

/**
 * ## Styles
 */
var styles = StyleSheet.create({
  header: {
    paddingTop: 34, // TODO: use react-native-safe-area?
    padding: 10,
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
