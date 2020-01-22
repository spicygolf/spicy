'use strict';

import React from 'react';
import {
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';

import GameList from './gamelist';



// TODO: put most of this in a render-only component GameList, to use
//       useQuery hook.  Can we further get rid of the rest of this?
class Games extends React.Component {

  constructor(props) {
    super(props);
    //console.log('games props', props);
    this.state = {
      currentPlayerKey: null
    };
  }

  async componentDidMount() {
    const data = await AsyncStorage.getItem('currentPlayer');
    this.setState({
      currentPlayerKey: data
    });
  }

  render() {
    const { currentPlayerKey } = this.state;

    if( !currentPlayerKey ) {
      return (
        <ActivityIndicator />
      );
    }

    return (
      <GameList
        currentPlayerKey={this.state.currentPlayerKey}
        navigation={this.props.navigation}
      />
    );

  }

}

export default Games;
