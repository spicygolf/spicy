import React from 'react';
import {
  ActivityIndicator,
  Text,
  View
} from 'react-native';

import { useQuery } from '@apollo/react-hooks';

import moment from 'moment';

import {
  AddRoundMutation,
  GET_ROUNDS_FOR_PLAYER_DAY_QUERY
} from 'features/rounds/graphql';
import Rounds from './rounds';



const LinkRound = (props) => {

  const game_start = props.navigation.getParam('game_start');
  const pkey = props.navigation.getParam('pkey');
  const player = props.navigation.getParam('player');
  const gkey = props.navigation.getParam('gkey');

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
        game_start={game_start}
        pkey={pkey}
        player={player}
        gkey={gkey}
        navigation={props.navigation}
      />
    );
  }
  return null;

};

export default LinkRound;
