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
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@apollo/client';
import moment from 'moment';

import { GameContext } from 'features/game/gameContext';
import GameNav from 'features/games/gamenav';
import { GET_ROUNDS_FOR_PLAYER_DAY_QUERY } from 'features/rounds/graphql';



const LinkRoundList = props => {

  const { route } = props;
  const { player } = route.params;
  const { game } = useContext(GameContext);

  const { start: game_start } = game;
  const { _key: pkey } = player;

  const navigation = useNavigation();

  const setRound = round => {
    //console.log('setRound', round);
    navigation.navigate('LinkRound', {
      game, game,
      player: player,
      round: round,
    });

  };

  const { loading, error, data } = useQuery(GET_ROUNDS_FOR_PLAYER_DAY_QUERY, {
    variables: {
      pkey: pkey,
      day: game_start,
    },
  });
  if( loading ) return (<ActivityIndicator />);
  if (error) console.log('Error fetching rounds for player day', error);

  if( data && data.getRoundsForPlayerDay ) {
    //console.log('setting rounds for ', pkey)
    if( data.getRoundsForPlayerDay.length == 0 ) {
      // didn't find any rounds, so LinkRound will create one and link
      // everything.  It'll take over from here.
      //console.log('no rounds for player day');
      setRound(null);
      return null;
    } else {

      // we have a list and a button to show
      return (
          <View style={styles.container}>
            <GameNav
              title='Choose Round'
              showBack={true}
              backTo={'GameSetup'}
            />
            <View>
              <Text style={styles.explanation}>
                {player.name} is already playing round(s) today.
                Please choose one from the list or create a new round for this game.
              </Text>

              <FlatList
                data={data.getRoundsForPlayerDay}
                renderItem={({item, index}) => {
                  return (
                    <ListItem
                      key={index}
                      title={moment(item.date).format('llll')}
                      onPress={() => setRound(item)}
                    />
                  );
                }}
                keyExtractor={(_item, index) => index.toString()}
              />
              <Button
                title="Add New Round"
                onPress={() => setRound(null)}
              />
            </View>
          </View>
        );
    }
  } else {
    // shouldn't ever get here /shrug
    console.log('no data for getRoundsForPlayerDay');
    return null;
  }
  return null;

};

export default LinkRoundList;


const styles = StyleSheet.create({
  container: {
    padding: 5,
  },
  explanation: {
    padding: 10,
  },
});
