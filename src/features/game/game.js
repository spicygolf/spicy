import React, { useContext } from 'react';

import {
  ActivityIndicator,
  Text
} from 'react-native';

import { useQuery } from '@apollo/client';
import { GET_GAME_QUERY } from 'features/games/graphql';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { GameContext } from 'features/game/gameContext';
import GameStack from 'features/game/gamestack';



const Game = props => {

  const { route } = props;
  const { currentGameKey, setup } = route.params;
  //console.log('currentGameKey', currentGameKey);
  //console.log('setup', setup);

  const { currentPlayerKey } = useContext(CurrentPlayerContext);
  //console.log('currentPlayerKey', currentPlayerKey);

  // get game
  const { loading, error, data } = useQuery(GET_GAME_QUERY, {
    variables: {
      gkey: currentGameKey
    },
  });
  if( loading ) return (<ActivityIndicator />);
  if( error ) {
    console.log(error);
    // TODO: error component
    return (<Text>Error</Text>);
  }

  if( data && data.getGame ) {
    // got game
    //console.log('g_data', g_data);
    const game = data.getGame;
    console.log('game', game);

    return (
      <GameContext.Provider value={{
        gkey: game._key,
        game: game,
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

export default Game;
