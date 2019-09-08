import React from 'react';
import {
  ActivityIndicator,
  Text
} from 'react-native';

import moment from 'moment';

import { useMutation } from '@apollo/react-hooks';

import {
  ADD_ROUND_MUTATION
} from 'features/rounds/graphql';




const Rounds = (props) => {

  const [ addRound, { loading, error, data } ] = useMutation(ADD_ROUND_MUTATION);


  if( props.rounds.length === 0 ) {
/*
    addRound({
      variables: {
        round: {
          date: props.game_start,
          seq: 1,
          scores: []
        }
      }
    });
    if( loading ) return (<ActivityIndicator />);
    if (error) return (<Text>Error! ${error.message}</Text>);
    console.log('Rounds addRound data', data);
*/
    return (<Text>No Rounds, so added one</Text>);
  }

  return (<Text>Rounds List</Text>);

};

export default Rounds;
