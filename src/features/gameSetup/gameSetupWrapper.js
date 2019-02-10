import React from 'react';

import GameSetup from 'features/gameSetup/gameSetup';
import { setGameSetupRef } from 'features/gameSetup/gameSetupFns';



class GameSetupWrapper extends React.Component {

  render() {
    const gkey = this.props.navigation.getParam('gkey') || [];
    const tee = this.props.navigation.getParam('tee') || [];
    const players = this.props.navigation.getParam('players') || [];
    const gamespec = this.props.navigation.getParam('gamespec');


    return (
      <GameSetup
        ref={gameSetupRef => {
          setGameSetupRef(gameSetupRef);
        }}
        gkey={gkey}
        gamespec={gamespec}
        players={players}
        tee={tee}
      />
    );
  }

}


export default GameSetupWrapper;
