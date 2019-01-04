import React from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';

import GameNav from 'features/games/gamenav';


class AddPlayer extends React.Component {

  render() {
    return (
      <View>
        <GameNav
          title='Add Player'
          showBack={true}
          navigation={this.props.navigation}
        />
        <Text>add player</Text>
      </View>
    );
  }

}

export default AddPlayer;
