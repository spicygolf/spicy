import React from 'react';

import { useMutation } from '@apollo/react-hooks';
import { ADD_ROUND_MUTATION } from 'features/rounds/graphql';



const AddRound = (props) => {
  console.log('addRound props', props);

  const [ addRound, { loading, data } ] = useMutation(ADD_ROUND_MUTATION);

  console.log('addRound', loading, data);

  return () => (
    addRound({
      variables: {
        round: {
          date: props.game_start,
          seq: 1,
          scores: []
        }
      }
    })
  );

};

export default AddRound;
