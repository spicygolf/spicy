import React from 'react';

import GameSetup from 'features/gameSetup/gameSetup';
import { setGameSetupRef } from 'features/gameSetup/gameSetupFns';



class GameSetupWrapper extends React.Component {

  render() {
    const players = this.props.navigation.getParam('players') || [];
    const courses = this.props.navigation.getParam('courses') || [];
    const gamespec = this.props.navigation.getParam('gamespec');


    return (
      <GameSetup
        ref={gameSetupRef => {
          setGameSetupRef(gameSetupRef);
        }}
        gamespec={gamespec}
        players={players}
        courses={courses}
      />
    );
  }

}


export default GameSetupWrapper;
