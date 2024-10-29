import { useMutation } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import { ADD_LINK_MUTATION } from 'common/graphql/link';
import { getHoles, omitTypename } from 'common/utils/game';
import { omitDeep } from 'common/utils/game';
import { ADD_GAME_MUTATION } from 'features/games/graphql';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

const NewGame = (props) => {
  const { route } = props;
  const { gamespec, game_start } = route.params;
  //console.log('newGame', gamespec, game_start);

  const { currentPlayer } = useContext(CurrentPlayerContext);
  const [gkey, setGkey] = useState(null);

  const navigation = useNavigation();
  const [addGameMutation] = useMutation(ADD_GAME_MUTATION);
  const [addLinkMutation] = useMutation(ADD_LINK_MUTATION);

  const teams_rotate =
    gamespec.team_change_every && gamespec.team_change_every > 0
      ? `every${gamespec.team_change_every}`
      : 'never';

  /*
    // TODO: for #140, maybe something like:
              (with the commented out optimisticResponse below)
    const temp_key = Date.now() + '_' + currentPlayerKey;
    if( data.addGame._key == temp_key ) {
      set flag of "temp keys" to true;
      add nested object of { game , links: [ link, link ] } into a local store;
    }
    * send temp_keys flag thru to other mutations depending on this _key that
      we made up because lack of connectivity
    * periodically read local store and update _keys of actual data in database
      when connectivity is restored
    * how would other phones / clients w subscriptions act?
*/

  const initialHoles = getHoles({
    scope: {
      holes: 'all18',
    },
    holes: [],
  });

  let newGame = {
    __typename: 'Game',
    name: gamespec.disp,
    start: game_start,
    scope: {
      __typename: 'GameScope',
      holes: 'all18',
      teams_rotate,
    },
    holes: initialHoles.map((h) => ({
      __typename: 'GameHole',
      hole: h,
      teams: [],
      multipliers: [],
    })),
    options: gamespec.defaultOptions || [],
  };

  // TODO: we may have to add `__typename: 'Option'` if there's anything in gamespec.defaultOptions
  const newGameWithoutTypes = omitTypename(newGame);

  // add new game
  const addGame = useCallback(
    async () => {
      //console.log('Begin adding game');
      const { error, data } = await addGameMutation({
        variables: {
          game: newGameWithoutTypes,
        },
      });

      if (error && error.message !== 'Network request failed') {
        console.log('Error adding game: ', error.message);
      }
      //console.log('newGame data', data);
      return data.addGame;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [newGameWithoutTypes],
  );

  const linkGameToGamespec = useCallback(
    async (game) => {
      //console.log('Begin linking game to gamespec');
      const { error, data } = await addLinkMutation({
        variables: {
          from: { type: 'game', value: game._key },
          to: { type: 'gamespec', value: gamespec._key },
        },
      });
      if (error && error.message !== 'Network request failed') {
        console.log('Error linking game to gamespec: ', error.message);
      }
      //console.log('newGame linkg2gs', data);
      return data.link;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gamespec._key],
  );

  // New game has been created, now link current user to it
  useEffect(() => {
    if (currentPlayer && gkey) {
      // we don't have a game object in GameContext yet, so we have to make one up
      // to send to LinkRoundList and friends
      const game = {
        _key: gkey,
        ...newGameWithoutTypes,
        gamespecs: [gamespec],
      };
      const player = omitDeep(currentPlayer, '__typename');
      delete player.token;
      // TODO: maybe read a user setting and not do this?
      // Caddies & scorers wouldn't always want to be added.
      // If setting is false, navigate to 'Game' only
      navigation.navigate('Game', {
        currentGameKey: gkey,
        screen: 'Setup',
        params: {
          screen: 'LinkRoundList',
          params: {
            game,
            player,
          },
        },
      });
    }
  }, [currentPlayer, gamespec, gkey, navigation, newGameWithoutTypes]);

  useEffect(
    () => {
      //console.log('createNewGame');
      const createNewGame = async () => {
        const game = await addGame();
        await linkGameToGamespec(game);
        setGkey(game._key);
      };
      if (!gkey) {
        createNewGame();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gkey],
  );

  return (
    <View>
      <ActivityIndicator />
    </View>
  );
};

export default NewGame;
