import React from 'react';

import {
  View
} from 'react-native';

import GameNav from 'features/games/gamenav';
import SearchPlayers from 'features/gameSetup/searchPlayers'


class AddPlayer extends React.Component {

  render() {
    return (
      <View>
        <GameNav
          title='Add Player'
          showBack={true}
          navigation={this.props.navigation}
        />
        <SearchPlayers />
      </View>
    );
  }

}

export default AddPlayer;
