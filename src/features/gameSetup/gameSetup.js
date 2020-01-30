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

    const game = props.screenProps.game;
    this.state = {
      game: game,
      currentPlayerKey: null,
    };

    if( props.screenProps.setup ) {
      props.navigation.navigate('Setup');
      return;
    }

  }

  async componentDidMount() {
    const cpkey = await AsyncStorage.getItem('currentPlayer');
    this.setState({
      currentPlayerKey: cpkey
    });
  }


  render() {
    return (
      <GameSetupStack
        navigation={this.props.navigation}
        screenProps={this.state}
      />
    );
  }

}


export default GameSetup;
