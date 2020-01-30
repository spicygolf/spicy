import React from 'react';

import AsyncStorage from '@react-native-community/async-storage';

import GameSetupStack from 'features/gameSetup/gameSetupStack';



class GameSetup extends React.Component {

    // https://stackoverflow.com/questions/54038075/v1-to-v3-migration-nested-tabs
    static router = {
      ...GameSetupStack.router,
      getStateForAction: (action, lastState) => {
        return GameSetupStack.router.getStateForAction(action, lastState);
      },
    };

  constructor(props) {
    super(props);
    //console.log('gameSetup props', props);

    // TODO: with Nav5, do this dynamically
//    if( props.setup ) {
//      props.navigation.navigate('Setup');
//      return;
//    }

  }

  render() {
    return (
      <GameSetupStack
        navigation={this.props.navigation}
      />
    );
  }

}


export default GameSetup;
