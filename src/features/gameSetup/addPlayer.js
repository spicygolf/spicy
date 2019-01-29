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
        />
        <SearchPlayers
          navigation={this.props.navigation}
        />
      </View>
    );
  }

}

export default AddPlayer;
