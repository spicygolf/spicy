import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
} from 'react-native';
import { useMutation } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';

import {
  ACTIVE_GAMES_FOR_PLAYER_QUERY,
  ADD_GAME_MUTATION,
} from 'features/games/graphql';
import { ADD_LINK_MUTATION } from 'common/graphql/link';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';



const NewGame = props => {

  const { route } = props;
  const { gamespec, game_start } = route.params;
  //console.log('newGame', gamespec, game_start);

  const { currentPlayer, currentPlayerKey } = useContext(CurrentPlayerContext);
  const [ gkey, setGkey ] = useState(null);

  const navigation = useNavigation();
  const [ addGameMutation ] = useMutation(ADD_GAME_MUTATION);
  const [ addLinkMutation ] = useMutation(ADD_LINK_MUTATION);

  // add new game
  const addGame = async () => {
    const { loading, error, data } = await addGameMutation({
      variables: {
        game: {
          name: gamespec.disp,
          start: game_start,
          scope: {
            holes: 'all18',
            teams_rotate: 'never',
          },
          holes: [],
          options: gamespec.defaultOptions || []
        },
      },
    });
    // TODO: handle loading, error?
    //console.log('newGame data', data);
    return data.addGame;
  };

  const linkGameToGamespec = async (game) => {
    const { loading, error, data } = await addLinkMutation({
      variables: {
        from: {type: 'game', value: game._key},
        to: {type: 'gamespec', value: gamespec._key},
      },
      refetchQueries: () => [{
        query: ACTIVE_GAMES_FOR_PLAYER_QUERY,
        variables: {
          pkey: currentPlayerKey,
        },
        fetchPolicy: 'cache-and-network',
      }],
      awaitRefetchQueries: true,  // TODO: shouldn't need this
    });
    // TODO: handle loading, error?
    //console.log('newGame linkg2gs', data);
    return data.link;

  };

  // New game has been created, so navigate to it.
  // Send directly to LinkRoundList so the creator can be added to the game
  // and a round created for them (or existing round chosen).
  if( currentPlayer && gkey ) {
    const player = {
      _key: currentPlayer._key,
      name: currentPlayer.name,
      handicap: currentPlayer.handicap,
    }
    navigation.navigate('Game', {
      currentGameKey: gkey,
      screen: 'GameSetup',
      params: {
        screen: 'LinkRoundList',
        params: {
          player: player,
        },
      },
    });
  }

  useEffect(
    () => {
      //console.log('createNewGame');
      const createNewGame = async () => {
        const game = await addGame();
        await linkGameToGamespec(game)
        setGkey(game._key);
      };
      createNewGame();
    }, []
  );

  return (
    <ActivityIndicator />
  );

};

export default NewGame;
