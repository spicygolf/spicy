import Error from 'common/components/error';
import { scoring } from 'common/utils/score';
import { GameContext } from 'features/game/gameContext';
import GameStack from 'features/game/gamestack';
import GameUpdatedListener from 'features/game/gameUpdatedListener';
import { useGetGameQuery } from 'features/game/hooks/useGetGameQuery';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import ScorePostedListener from 'features/rounds/scorePostedListener';
import useAppState from 'hooks/useAppState';
import React, { useContext, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

const Game = (props) => {
  const { route } = props;
  const { currentGameKey, readonly } = route.params;

  const { currentPlayer } = useContext(CurrentPlayerContext);
  const { justBecameActive } = useAppState();

  // execute the getGame query
  const { loading, error, refetch, data } = useGetGameQuery({
    variables: {
      gkey: currentGameKey,
    },
  });

  useEffect(
    () => {
      if (justBecameActive) {
        refetch();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [justBecameActive],
  );

  if (loading) {
    return <ActivityIndicator />;
  }

  if (error && error.message !== 'Network request failed') {
    return <Error error={error} />;
  }

  if (data?.getGame) {
    const game = data.getGame;
    const scores = scoring(game);
    console.log({ game, scores, ts: new Date() });
    // console.log('game');
    // console.log(JSON.stringify(game, null, 2));
    // console.log('scores');
    // console.log(JSON.stringify(scores, null, 2));

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
    const round_listeners = game.rounds.map((r) => <ScorePostedListener rkey={r._key} />);

    return (
      <GameContext.Provider
        value={{
          gkey,
          game,
          scores,
          currentPlayerKey: currentPlayer._key,
          activeGameSpec,
          readonly,
        }}>
        {game_listener}
        {round_listeners}
        <GameStack />
      </GameContext.Provider>
    );
  }

  return (
    <Error
      error={{
        message: 'getGame query returned nothing.  Cache funkiness?',
        remedy: 'Profile -> Settings -> Clear Local Data',
      }}
    />
  );
};

export default Game;
