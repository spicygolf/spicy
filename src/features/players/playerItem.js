import React from 'react';

import {
  ActivityIndicator,
  Text
} from 'react-native';



class PlayerItem extends React.Component {

  render() {
    const player = this.props.navigation.getParam('player');
    console.log('player_item', player);

    return (<Text>{player.name || 'no player'}</Text>);
  }
}


export default PlayerItem;
