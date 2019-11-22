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
    if(    props.screenProps
        && props.screenProps.currentGame
        && props.screenProps.game
      ) {
      // coming from 'game' so use screenProps
      const game = props.screenProps.game;
      this.state = {
        gkey: game._key,
        gametype: game.gametype,
        game_start: game.game_start,
        inGame: true,
        currentPlayerKey: null,
      };
    } else {
      // coming from 'games' so use navigation
      this.state = {
        gkey: this.props.navigation.getParam('gkey') || [],
        gametype: this.props.navigation.getParam('gametype') || [],
        game_start: this.props.navigation.getParam('game_start') || '',
        inGame: false,
        currentPlayerKey: null,
      };
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
        screenProps={{
          gkey: this.state.gkey,
          gametype: this.state.gametype,
          game_start: this.state.game_start,
          inGame: this.state.inGame,
          currentPlayerKey: this.state.currentPlayerKey
        }}
      />
    );
  }

}


export default GameSetup;
