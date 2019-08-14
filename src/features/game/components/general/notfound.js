
import React from 'react';

import
{
  StyleSheet,
  Text,
  View
} from 'react-native';



class GameNotFound extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View style={styles.LeaderboardContainer}>
        <Text>Game Type Not Found</Text>
      </View>
    );
  }

}

export default GameNotFound;


/**
 * ## Styles
 */
var styles = StyleSheet.create({

});
