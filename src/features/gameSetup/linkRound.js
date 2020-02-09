import React, { useContext } from 'react';
import {
  ActivityIndicator,
  Text,
  View
} from 'react-native';

import { useQuery } from '@apollo/react-hooks';

import { GameContext } from 'features/game/gameContext';
import { GET_ROUNDS_FOR_PLAYER_DAY_QUERY } from 'features/rounds/graphql';
import Rounds from 'features/gameSetup/rounds';



const LinkRound = (props) => {

  const { route } = props;
  const { player } = route.params;
  const { _key:pkey } = player;

  const { game } = useContext(GameContext);
  const { start: game_start } = game;

  const { loading, error, data } = useQuery(GET_ROUNDS_FOR_PLAYER_DAY_QUERY,  {
    variables: {
      pkey: pkey,
      day: game_start,
    }
  });

  if( loading ) return (<ActivityIndicator />);
  if (error) return (<Text>Error! ${error.message}</Text>);

  const rounds = (data && data.getRoundsForPlayerDay ) ?
    data.getRoundsForPlayerDay : [];

  if( rounds && Array.isArray(rounds) ) {
    return (
      <Rounds
        rounds={rounds}
        player={player}
      />
    );
  }
  return null;

};

export default LinkRound;
