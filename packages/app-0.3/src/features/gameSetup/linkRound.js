import { useNavigation } from '@react-navigation/native';
import Error from 'common/components/error';
import { addPlayerToOwnTeam, getGamespecKVs } from 'common/utils/game';
import { omitDeep } from 'common/utils/game';
import { query as getGameQuery } from 'features/game/hooks/useGetGameQuery';
import { query as activeGamesForPlayerQuery } from 'features/games/hooks/useActiveGamesForPlayerQuery';
import { useLinkRoundMutation } from 'features/gameSetup/hooks/useLinkRoundMutation';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import React, { useContext, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

const LinkRound = (props) => {
  const navigation = useNavigation();
  const { game, player: p, round: r, isNew: isNewRound } = props;

  const { _key: gkey, start: game_start } = game;

  const { _key: pkey } = p;
  const player = omitDeep(p, '__typename');

  let round =
    r && !isNewRound
      ? omitDeep(r, '__typename')
      : {
          date: game_start,
          seq: 1,
          scores: [],
        };

  const teamGame = getGamespecKVs(game, 'teams').includes(true);
  const newHoles = teamGame ? addPlayerToOwnTeam({ pkey, game }) : null;

  const { currentPlayer } = useContext(CurrentPlayerContext);
  const { _key: currentPlayerKey } = currentPlayer;

  const [linkRound, { loading, error, data }] = useLinkRoundMutation({
    variables: {
      gkey,
      player,
      isNewRound,
      round,
      newHoles,
      currentPlayerKey,
    },
    refetchQueries: () => [
      {
        query: getGameQuery,
        variables: { gkey },
      },
      {
        query: activeGamesForPlayerQuery,
        variables: {
          pkey: currentPlayerKey,
        },
        fetchPolicy: 'cache-and-network',
      },
    ],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    linkRound();
  }, [linkRound]);

  if (loading) {
    return <ActivityIndicator />;
  }
  if (error) {
    return <Error error={error} />;
  }

  if (data) {
    navigation.navigate('Game', {
      currentGameKey: gkey,
      screen: 'Setup',
      params: {
        screen: 'GameSetup',
      },
    });
  }

  return <ActivityIndicator />;
};

export default LinkRound;
