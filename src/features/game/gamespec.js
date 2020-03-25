import React, { useContext } from 'react';

import {
  ActivityIndicator,
  Text
} from 'react-native';

import { useQuery } from '@apollo/react-hooks';

import { GameContext } from 'features/game/gameContext';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import GameStack from 'features/game/gamestack';
import { GET_GAMESPEC_QUERY } from 'features/games/graphql';



const GameSpec = props => {

  const { currentPlayerKey } = useContext(CurrentPlayerContext);
  //console.log('currentPlayerKey', currentPlayerKey);

  const { game, setup } = props;

  // get gamespec
  const { loading, error, data } = useQuery(GET_GAMESPEC_QUERY, {
    variables: {
      gamespec: game.gametype
    }
  });
  if( loading ) return (<ActivityIndicator />);
  if( error ) {
    console.log(error);
    return (<Text>Error</Text>);
  }

  if( data ) {
    // got gamespec
    const gamespec = data.getGameSpec;
    console.log('gamespec', gamespec);

    // add data to the context and return gamestack
    return (
      <GameContext.Provider value={{
        game: game,
        gamespec: gamespec,
        currentPlayerKey: currentPlayerKey,
      }}>
        <GameStack
          setup={setup}
        />
      </GameContext.Provider>
    );

  } else {
    return (<ActivityIndicator />);
  }

};

export default GameSpec;