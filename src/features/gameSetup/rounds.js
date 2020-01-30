import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  ListItem
} from 'react-native-elements';

import moment from 'moment';

import { useMutation } from '@apollo/react-hooks';

import { ADD_LINK_MUTATION } from 'common/graphql/link'
import { ADD_ROUND_MUTATION } from 'features/rounds/graphql';
import { GET_GAME_QUERY } from 'features/games/graphql';
import { Button } from 'react-native-elements';



const Rounds = (props) => {

  //console.log('Rounds props', props);
  let content = null;

  const [ addRound ] = useMutation(ADD_ROUND_MUTATION);
  const [ linkRoundToGame ] = useMutation(ADD_LINK_MUTATION);
  const [ linkRoundToPlayer ] = useMutation(ADD_LINK_MUTATION);

  const linkRoundToGameAndPlayer = async (rkey, isNew) => {
    // link round to game
    let { loading: r2gLoading, error: r2gError, data: r2gData } = await linkRoundToGame({
      variables: {
        from: {type: 'round', value: rkey},
        to:   {type: 'game', value: props.gkey},
      },
      refetchQueries: () => [{
        query: GET_GAME_QUERY,
        variables: {
          gkey: props.gkey
        }
      }],

    });
    //console.log('r2gData', r2gData);

    if( isNew ) {
      // link round to player
      let { loading: r2pLoading, error: r2pError, data: r2pData } = await linkRoundToPlayer({
        variables: {
          from: {type: 'round', value: rkey},
          to:   {type: 'player', value: props.pkey},
        },
        refetchQueries: () => [{
          query: GET_GAME_QUERY,
          variables: {
            gkey: props.gkey
          }
        }],
      });
      //console.log('r2pData', r2pData);
    }

    props.navigation.navigate('GameSetup');

  };

  const addButton = (
    <Button
      title="Add New Round"
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

        linkRoundToGameAndPlayer(arData.addRound._key, true);
      }}
    />
  );

  if( props.rounds.length === 0 ) {
    content = (
      <View>
        {addButton}
      </View>
    );
  } else {
    //console.log('rounds props', props);
    content = (
      <View>
        <Text>
          {props.player.name} is already playing round(s) today.
          Please choose one from the list or create a new round.
        </Text>

        <FlatList
          data={props.rounds}
          renderItem={({item, index}) => {
            return (
              <ListItem
                key={index}
                title={moment(item.date).format('llll')}
                onPress={() => {
                  //console.log('round clicked', item);
                  linkRoundToGameAndPlayer(item._key, false);
                }}
              />
            );
          }}
          keyExtractor={(_item, index) => index.toString()}
        />

        {addButton}
      </View>
    );
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
