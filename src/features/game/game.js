import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  View,
} from 'react-native';
import { useLazyQuery } from '@apollo/client';

import useAppState from 'hooks/useAppState';
import { GET_GAME_QUERY } from 'features/game/graphql';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { GameContext } from 'features/game/gameContext';
import GameStack from 'features/game/gamestack';
import GameUpdatedListener from 'features/game/gameUpdatedListener';
import ScorePostedListener from 'features/rounds/scorePostedListener';
import { scoring } from 'common/utils/score';



const Game = props => {

  const { route } = props;
  const { currentGameKey } = route.params;
  //console.log('currentGameKey', currentGameKey);
  //console.log('Game route params', route.params);

  const [ game, setGame ] = useState(null);
  const [ scores, setScores ] = useState(null);

  const { currentPlayerKey } = useContext(CurrentPlayerContext);
  const { justBecameActive } = useAppState();
  const [ getGame, { error, data } ] = useLazyQuery(GET_GAME_QUERY);


  let content = (
    <View>
      <ActivityIndicator />
    </View>
  );

  if( error ) {
    console.log(error);
    // TODO: error component
    content = (<Text>Error Loading Game: `${error}`</Text>);
  }

  if( data && data.getGame && !game ) {
    setGame(data.getGame);
    console.log('game  ', data.getGame);
  }

  if( game && !scores ) {
    let s = scoring(game);
    setScores(s);
    console.log('scores', s);
  }

  if( game && scores ) {

    const { _key: gkey } = game;
    const activeGameSpec = (game && game.gamespecs && game.gamespecs[0])
      ? game.gamespecs[0]
      : null;

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

    content = (
      <GameContext.Provider value={{
        gkey,
        game,
        scores,
        currentPlayerKey,
        activeGameSpec,
      }}>
        { game_listener }
        { round_listeners }
        <GameStack />
      </GameContext.Provider>
    );

  }

  useEffect(() => {
    if( justBecameActive ) {
      console.log('justBecameActive getGame');
      getGame({
        variables: {
          gkey: currentGameKey,
        },
      });
    }
  }, [justBecameActive]);

  useEffect(() => {
    console.log('initial getGame');
    getGame({
      variables: {
        gkey: currentGameKey,
      },
    });
  }, []);

  return (content);

};

export default Game;
