import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import moment from 'moment';

import { useMutation } from '@apollo/react-hooks';

import { ADD_LINK_MUTATION } from 'common/graphql/link'
import { ADD_ROUND_MUTATION } from 'features/rounds/graphql';
import { Button } from 'react-native-elements';



const Rounds = (props) => {

  let content = null;

  const [ addRound ] = useMutation(ADD_ROUND_MUTATION);
  const [ linkRoundToGame ] = useMutation(ADD_LINK_MUTATION);
  const [ linkRoundToPlayer ] = useMutation(ADD_LINK_MUTATION);

  if( props.rounds.length === 0 ) {
    content = (
      <View>
        <Button
          title="Add Round"
          onPress={async () => {
            // add round
            let { loading: arLoading, error: arError, data: arData } = await addRound({
              variables: {
                round: {
                  date: props.game_start,
                  seq: 1,
                  scores: []
                }
              }
            });
            //console.log('arData', arData);

            // link round to game
            let { loading: r2gLoading, error: r2gError, data: r2gData } = await linkRoundToGame({
              variables: {
                from: {type: 'round', value: arData.addRound._key},
                to:   {type: 'game', value: props.gkey},
              }
            });
            //console.log('r2gData', r2gData);

            // link round to player
            let { loading: r2pLoading, error: r2pError, data: r2pData } = await linkRoundToPlayer({
              variables: {
                from: {type: 'round', value: arData.addRound._key},
                to:   {type: 'player', value: props.pkey},
              }
            });
            //console.log('r2pData', r2pData);
            props.navigation.navigate('GameSetup');
          }}
        />
      </View>
    );
  } else {
    content = (<Text>Rounds List</Text>);
  }

  return (
    <View style={styles.container}>
      {content}
    </View>
  );
};

export default Rounds;


const styles = StyleSheet.create({
  container: {
    padding: 5,
  }
});
