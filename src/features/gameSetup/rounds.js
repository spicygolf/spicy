import React, { useContext } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Button,
  ListItem,
} from 'react-native-elements';

import moment from 'moment';

import { useMutation } from '@apollo/react-hooks';
import { useNavigation } from '@react-navigation/native';

import { GameContext } from 'features/game/gameContext';
import { ADD_LINK_MUTATION } from 'common/graphql/link'
import { ADD_ROUND_MUTATION } from 'features/rounds/graphql';
import { GET_GAME_QUERY } from 'features/games/graphql';
import { course_handicap } from '../../common/utils/handicap';



const Rounds = props => {

  //console.log('Rounds props', props);
  const { player, rounds} = props;
  const { _key: pkey } = player;

  const { game } = useContext(GameContext);
  const { _key: gkey, start: game_start } = game;

  let content = null;

  const [ addRound ] = useMutation(ADD_ROUND_MUTATION);
  const [ linkRoundToGame ] = useMutation(ADD_LINK_MUTATION);
  const [ linkRoundToPlayer ] = useMutation(ADD_LINK_MUTATION);

  const navigation = useNavigation();

  const linkRoundToGameAndPlayer = (round, isNew) => {

    console.log('linking round to game and player');
    const { _key: rkey, tee } = round;

    // first see if we can calc a course_handicap
    let other = [];
    try {
      const index = round.player[0].handicap.value;
      const ch = course_handicap(index, tee, game.holes);
      console.log('LinkRound ch', ch);
      if( ch ) other.push({key: 'course_handicap', value: ch});
      console.log('LinkRound other', other);
    } catch(e) {
      console.log('Could not calc a course handicap for ', round);
    }

    // link round to game
    let { loading: r2gLoading, error: r2gError, data: r2gData } = linkRoundToGame({
      variables: {
        from  : {type: 'round', value: rkey},
        to    : {type: 'game', value: gkey},
        other: other,
      },
      refetchQueries: () => [{
        query: GET_GAME_QUERY,
        variables: {
          gkey: gkey
        }
      }],
      awaitRefetchQueries: true,
    });
    //console.log('r2gData', r2gData);

    if( isNew ) {
      // link round to player
      let { loading: r2pLoading, error: r2pError, data: r2pData } = linkRoundToPlayer({
        variables: {
          from: {type: 'round', value: rkey},
          to:   {type: 'player', value: pkey},
        },
        refetchQueries: () => [{
          query: GET_GAME_QUERY,
          variables: {
            gkey: gkey
          }
        }],
        awaitRefetchQueries: true,
      });
      //console.log('r2pData', r2pData);
    }

    navigation.navigate('GameSetup');

  };

  const addButton = (
    <Button
      title="Add New Round"
      onPress={async () => {
        // add round
        let { loading: arLoading, error: arError, data: arData } = await addRound({
          variables: {
            round: {
              date: game_start,
              seq: 1,
              scores: []
            }
          },
        });
        console.log('arData', arData);

        linkRoundToGameAndPlayer(arData.addRound, true);
      }}
    />
  );

  if( rounds.length === 0 ) {
    content = (
      <View>
        {addButton}
      </View>
    );
  } else {
    //console.log('rounds props', props);
    content = (
      <View>
        <Text style={styles.explanation}>
          {player.name} is already playing round(s) today.
          Please choose one from the list or create a new round for this game.
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
                  linkRoundToGameAndPlayer(item, false);
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
  },
  explanation: {
    padding: 10,
  },
});
