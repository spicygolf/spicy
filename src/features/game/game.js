import React, { useContext } from 'react';
import {
  ActivityIndicator,
  Text
} from 'react-native';
import { useQuery } from '@apollo/client';

import { GET_GAME_QUERY } from 'features/game/graphql';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { GameContext } from 'features/game/gameContext';
import GameStack from 'features/game/gamestack';
import GameUpdatedListener from 'features/game/gameUpdatedListener';
import ScorePostedListener from 'features/rounds/scorePostedListener';
import { scoring } from 'common/utils/score';


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
    console.log('game  ', game);

     const game_listener = (
       <GameUpdatedListener gkey={game._key} />
     );

    /* This is the place where we have all players' rounds as data. It can be
       updated by other players, so here is a good place to kick off a
       subscription to listen for those other changes, update the cache and
       therefore update the display with the scores others have entered.
       We need key as well as rkey, because we include listeners as children of
       the GameContext.Provider below, even tho they don't render anything.
    */
    const round_listeners = game.rounds.map(r => (
      <ScorePostedListener key={r._key} rkey={r._key} />
    ));

    const scores = scoring(game);
    console.log('scores', scores);

    return (
      <GameContext.Provider value={{
        gkey: game._key,
        game: game,
        scores: scores,
        currentPlayerKey: currentPlayerKey,
      }}>
        { game_listener }
        { round_listeners }
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
