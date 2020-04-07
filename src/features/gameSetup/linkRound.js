import React, { useContext, useEffect, useState } from 'react';
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
import { useLazyQuery } from '@apollo/react-hooks';

import GameNav from 'features/games/gamenav';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { GameContext } from 'features/game/gameContext';
import { ADD_LINK_MUTATION } from 'common/graphql/link'
import { ADD_ROUND_MUTATION } from 'features/rounds/graphql';
import { GET_ROUNDS_FOR_PLAYER_DAY_QUERY } from 'features/rounds/graphql';
import {
  linkPlayerToGame,
  linkRoundToGameAndPlayer,
} from 'common/utils/links';



const LinkRound = props => {

  //console.log('LinkRound');
  const { route } = props;
  const { player } = route.params;
  const { currentPlayerKey } = useContext(CurrentPlayerContext);

  const [ rounds, setRounds ] = useState(null);
  const [ madeNewRound, setMadeNewRound ] = useState(false);
  const newRound = ( rounds && rounds.length === 0 );
  //console.log('LinkRound', rounds, newRound);

  const { game } = useContext(GameContext);
  const { _key: gkey, start: game_start } = game;
  const { _key: pkey } = player;

  const navigation = useNavigation();
  const [ addRound ] = useMutation(ADD_ROUND_MUTATION);
  const [ link ] = useMutation(ADD_LINK_MUTATION);
  const [ linkRoundToGame ] = useMutation(ADD_LINK_MUTATION);
  const [ linkRoundToPlayer ] = useMutation(ADD_LINK_MUTATION);

  const [ getRoundsForPlayerDay, { error, data } ] = useLazyQuery(
    GET_ROUNDS_FOR_PLAYER_DAY_QUERY
  );
  if (error) console.log('Error fetching rounds for player day', error);

  if( data && data.getRoundsForPlayerDay && !rounds ) {
    //console.log('setting rounds for ', pkey)
    setRounds(data.getRoundsForPlayerDay);
  }

  const createNewRound = async () => {
    //console.log('creating new round');

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
    //console.log('arData', arData);

    linkRoundToGameAndPlayer({
      round: arData.addRound,
      game: game,
      player: player,
      isNew: true,
      linkRoundToGame: linkRoundToGame,
      linkRoundToPlayer: linkRoundToPlayer,
    });
    navigation.navigate('GameSetup');

  };

  if( newRound && !madeNewRound ) {
    createNewRound();
    setMadeNewRound(true);
  }

  const addButton = (
    <Button
      title="Add New Round"
      onPress={async () => {
        await createNewRound();
      }}
    />
  );

  let content = null;

  if( rounds && Array.isArray(rounds) ) {
    if( rounds.length === 0 ) {
      content = addButton;
    } else {
      content = (
        <View>
          <Text style={styles.explanation}>
            {player.name} is already playing round(s) today.
            Please choose one from the list or create a new round for this game.
          </Text>

          <FlatList
            data={rounds}
            renderItem={({item, index}) => {
              return (
                <ListItem
                  key={index}
                  title={moment(item.date).format('llll')}
                  onPress={async () => {
                    //console.log('round clicked', item);
                    await linkRoundToGameAndPlayer({
                      round: item,
                      game: game,
                      player: player,
                      isNew: false,
                      linkRoundToGame: linkRoundToGame,
                      linkRoundToPlayer: linkRoundToPlayer,
                    });
                    navigation.navigate('GameSetup');
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
  } else {
    content = (<ActivityIndicator />);
  }

  useEffect(
    () => {
      const init = async () => {
        //console.log('linkRound useEffect init', pkey, currentPlayerKey);
        await linkPlayerToGame({
          pkey: pkey,
          gkey: gkey,
          link: link,
          currentPlayerKey: currentPlayerKey,
        });
      };
      init();
    }, []
  );

  useEffect(
    () => {
      //console.log('getRoundsForPlayerDay', pkey);
      getRoundsForPlayerDay({
        variables: {
          pkey: pkey,
          day: game_start,
        },
      });
    }, []
  );

  return (
    <View style={styles.container}>
      <GameNav
        title='Choose Round'
        showBack={true}
        backTo={'GameSetup'}
      />
      {content}
    </View>
  );
};

export default LinkRound;


const styles = StyleSheet.create({
  container: {
    padding: 5,
  },
  explanation: {
    padding: 10,
  },
});
