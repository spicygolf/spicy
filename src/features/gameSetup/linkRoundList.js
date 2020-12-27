import React, { useState } from 'react';
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
import { useQuery } from '@apollo/client';
import moment from 'moment';

import GameNav from 'features/games/gamenav';
import { GET_ROUNDS_FOR_PLAYER_DAY_QUERY } from 'features/rounds/graphql';
import LinkRound from 'features/gameSetup/linkRound';



const LinkRoundList = props => {

  const { route } = props;
  const { game, player } = route.params;

  const { start: game_start } = game;
  const { _key: pkey } = player;

  const [ round, setRound ] = useState(null);
  const [ isNew, setIsNew ] = useState(null);
  const [ gotoLinkRound, setGotoLinkRound ] = useState(false);

  const chooseRound = (round, isNew) => {
    setRound(round);
    setIsNew(isNew);
    setGotoLinkRound(true);
  };

  const { loading, error, data } = useQuery(GET_ROUNDS_FOR_PLAYER_DAY_QUERY, {
    variables: {
      pkey: pkey,
      day: game_start,
    },
  });
  if( loading ) return (<ActivityIndicator />);
  if (error) console.log('Error fetching rounds for player day', error);

  if( data && data.getRoundsForPlayerDay && !gotoLinkRound ) {
    //console.log('setting rounds for ', pkey)
    if( data.getRoundsForPlayerDay.length == 0 ) {
      // didn't find any rounds, so LinkRound will create one and link
      // everything.  It'll take over from here.
      //console.log('no rounds for player day');
      chooseRound(null, true);
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
                    onPress={() => chooseRound(item, false)}
                    testID={`choose_existing_round_${index}`}
                  >
                    <ListItem.Content>
                      <ListItem.Title>{moment(item.date).format('llll')}</ListItem.Title>
                    </ListItem.Content>
                  </ListItem>
                );
              }}
              keyExtractor={(_item, index) => index.toString()}
            />
            <Button
              title="Add New Round"
              onPress={() => chooseRound(null, true)}
              testID='add_new_round'
            />
          </View>
        </View>
      );
    }
  }

  if( gotoLinkRound ) {
    return (
      <LinkRound
        game={game}
        player={player}
        round={round}
        isNew={isNew}
      />
    );
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
