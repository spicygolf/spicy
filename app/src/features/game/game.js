import { useQuery } from '@apollo/client';
import Error from 'common/components/error';
import { scoring } from 'common/utils/score';
import { GameContext } from 'features/game/gameContext';
import GameStack from 'features/game/gamestack';
import GameUpdatedListener from 'features/game/gameUpdatedListener';
import { GET_GAME_QUERY } from 'features/game/graphql';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import ScorePostedListener from 'features/rounds/scorePostedListener';
import useAppState from 'hooks/useAppState';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

const Game = (props) => {
  const { route } = props;
  const { currentGameKey, readonly } = route.params;

  const { currentPlayerKey } = useContext(CurrentPlayerContext);
  const { justBecameActive } = useAppState();

  const [content, setContent] = useState(<ActivityIndicator />);

  // execute the getGame query
  const { loading, error, refetch, data } = useQuery(GET_GAME_QUERY, {
    variables: {
      gkey: currentGameKey,
    },
  });

  useEffect(() => {
    if (loading) {
      setContent(<ActivityIndicator />);
    }

    if (error && error.message !== 'Network request failed') {
      setContent(<Error error={error} />);
    }

    if (data?.getGame) {
      const game = data.getGame;
      const scores = scoring(game);
      console.log({ game, scores, ts: new Date() });

      const { _key: gkey } = game;
      const activeGameSpec =
        game && game.gamespecs && game.gamespecs[0] ? game.gamespecs[0] : null;

      const game_listener = <GameUpdatedListener gkey={game._key} />;

      /* This is the place where we have all players' rounds as data. It can be
          updated by other players, so here is a good place to kick off a
          subscription to listen for those other changes, update the cache and
          therefore update the display with the scores others have entered.
          We need key as well as rkey, because we include listeners as children of
          the GameContext.Provider below, even tho they don't render anything.
        */
      const round_listeners = game.rounds.map((r) => (
        <ScorePostedListener key={r._key} rkey={r._key} />
      ));

      setContent(
        <GameContext.Provider
          value={{
            gkey,
            game,
            scores,
            currentPlayerKey,
            activeGameSpec,
            readonly,
          }}>
          {game_listener}
          {round_listeners}
          <GameStack />
        </GameContext.Provider>,
      );
    }
  }, [currentGameKey, currentPlayerKey, data, error, loading, readonly]);

  useEffect(() => {
    if (justBecameActive) {
      refetch();
    }
  }, [justBecameActive, refetch]);

  return content;
};

export default Game;
