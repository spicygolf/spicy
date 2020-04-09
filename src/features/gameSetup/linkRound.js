import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
} from 'react-native';
import { useMutation } from '@apollo/react-hooks';
import { useNavigation } from '@react-navigation/native';

import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { ADD_LINK_MUTATION } from 'common/graphql/link'
import { ADD_ROUND_MUTATION } from 'features/rounds/graphql';
import {
  linkPlayerToGame,
  linkRoundToGameAndPlayer,
} from 'common/utils/links';



const LinkRound = props => {

  const { route } = props;
  const { game, player, round } = route.params;
  //console.log('LinkRound', player, round);

  const { currentPlayerKey } = useContext(CurrentPlayerContext);

  //const { game } = useContext(GameContext);
  const { _key: gkey, start: game_start } = game;
  const { _key: pkey } = player;

  const navigation = useNavigation();
  const [ addRound ] = useMutation(ADD_ROUND_MUTATION);
  const [ link ] = useMutation(ADD_LINK_MUTATION);
  const [ linkRoundToGame ] = useMutation(ADD_LINK_MUTATION);
  const [ linkRoundToPlayer ] = useMutation(ADD_LINK_MUTATION);


  const createNewRound = async () => {
    //console.log('createNewRound');
    // add round
    const { loading, error, data } = await addRound({
      variables: {
        round: {
          date: game_start,
          seq: 1,
          scores: []
        }
      },
    });
    if( error ) {
      console.log('Error creating new round', error);
      return null;
    }
    return data.addRound;
  };

  const linkRound = async r => {
    //console.log('linkRound');
    await linkRoundToGameAndPlayer({
      round: r,
      game: game,
      player: player,
      isNew: true,
      linkRoundToGame: linkRoundToGame,
      linkRoundToPlayer: linkRoundToPlayer,
    });
  };

  useEffect(
    () => {
      const init = async () => {
        //console.log('linkPlayerToGame', pkey, currentPlayerKey);
        await linkPlayerToGame({
          pkey: pkey,
          gkey: gkey,
          link: link,
          currentPlayerKey: currentPlayerKey,
        });

        let r = round ? round : await createNewRound();
        await linkRound(r);

        navigation.navigate('GameSetup');
      };
      init();
    }, []
  );

  return (<ActivityIndicator />);

};

export default LinkRound;

