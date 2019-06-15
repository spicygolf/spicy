import React from 'react';
import GameSetup from 'features/gameSetup/gameSetup';
import { setGameSetupRef } from 'features/gameSetup/gameSetupFns';



class GameSetupWrapper extends React.Component {

  render() {
    const gkey = this.props.navigation.getParam('gkey') || [];
    const tee = this.props.navigation.getParam('tee') || [];
    const players = this.props.navigation.getParam('players') || [];
    const gametype = this.props.navigation.getParam('gametype');

    return (
      <GameSetup
        ref={gameSetupRef => {
          setGameSetupRef(gameSetupRef);
        }}
        gkey={gkey}
        gametype={gametype}
        players={players}
        tee={tee}
      />
    );
  }

}


export default GameSetupWrapper;
