import React from 'react';

import {
  ActivityIndicator,
  Text
} from 'react-native';

import { useQuery } from '@apollo/react-hooks';
import { GET_GAME_QUERY } from 'features/games/graphql';
import GameSpec from 'features/game/gamespec';


const Game = props => {

  const { route } = props;
  const { currentGameKey } = route.params;
  //console.log('currentGameKey', currentGameKey);

  // get game
  const { loading, error, data } = useQuery(GET_GAME_QUERY, {
    variables: {
      gkey: currentGameKey
    },
  });
  if( loading ) return (<ActivityIndicator />);
  if( error ) {
    console.log(error);
    return (<Text>Error</Text>);
  }

  if( data ) {
    // got game
    //console.log('g_data', g_data);
    const game = data.getGame;
    console.log('game', game);

    // le sigh, we have to pass game and currentPlayerKey onto <GameSpec>
    // because RN doesn't like an increasing or decreasing number of hooks run
    // for different renders.
    return (
      <GameSpec
        game={game}
      />
    );

  } else {
    return (<ActivityIndicator />);
  }

};

export default Game;
