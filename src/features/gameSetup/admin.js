import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  Card,
} from 'react-native-elements';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import { find } from 'lodash';

import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { GameContext } from 'features/game/gameContext';
import { REMOVE_LINK_MUTATION } from 'common/graphql/unlink';
import {
  DELETE_GAME_MUTATION,
  GET_DELETE_GAME_INFO_QUERY
} from 'features/game/graphql';
import { DELETE_ROUND_MUTATION } from 'features/rounds/graphql';
import { rmlink } from 'common/utils/links';
import { rmgame } from 'common/utils/game';
import { rmround } from 'common/utils/rounds';



const Admin = props => {

  const { gkey, game } = useContext(GameContext);
  const { currentPlayerKey } = useContext(CurrentPlayerContext);

  const navigation = useNavigation();

  const [ showSure, setShowSure ] = useState(false);

  const [ unlink ] = useMutation(REMOVE_LINK_MUTATION);
  const [ deleteGame ] = useMutation(DELETE_GAME_MUTATION);
  const [ deleteRound ] = useMutation(DELETE_ROUND_MUTATION);

  const { loading, error, data } = useQuery(GET_DELETE_GAME_INFO_QUERY, {
    variables: {
      gkey: gkey,
    },
  });
  if( loading ) return (<ActivityIndicator />);
  if( error ) console.log('Error getting deleteGameInfo', error);

  //console.log('deleteGameInfo', data.getDeleteGameInfo);

  const doDeleteGame = async () => {
    const gkey = data.getDeleteGameInfo._key;
    const dgi = data.getDeleteGameInfo.deleteGameInfo;
    //console.log('deleteGame', gkey, dgi);

    // remove round2game links and rounds with no links to other games
    dgi.rounds.map(async r => {
      await rmlink('round', r.vertex, 'game', gkey, unlink);
      if( r && r.other && r.other.length == 0 ) {
        console.log('round to delete', r);
        // we need to delete round2player edge as well as round
        const gRound = find(game.rounds, {_key: r.vertex});
        if( gRound && gRound.player && gRound.player[0] && gRound.player[0]._key) {
          await rmlink('round', r.vertex, 'player', gRound.player[0]._key, unlink);
        }
        await rmround(r.vertex, deleteRound);
      }
    });

    // remove player links
    dgi.players.map(async p => {
      await rmlink('player', p.vertex, 'game', gkey, unlink);
    });

    // remove gamespec links
    dgi.gamespecs.map(async gs => {
      await rmlink('game', gkey, 'gamespec', gs.vertex, unlink);
    });

    // remove game
    await rmgame(gkey, currentPlayerKey, deleteGame);
    navigation.navigate('Games');
  };

  // render stuffs

  // TODO: we could show the rounds here, and give the user a choice as to
  // which ones they want to delete before deleting game.
  // They won't get the option to delete rounds linked to other games.
  const areYouSure = showSure ?  (
    <View>
      <Text style={styles.sure_txt}>Delete Game: Are you sure?</Text>
      <View style={styles.button_row}>
        <Button
          title='No'
          onPress={() => setShowSure(false)}
          containerStyle={styles.no_button}
        />
        <Button
          title='Yes'
          buttonStyle={styles.button}
          containerStyle={styles.yes_button}
          onPress={() => doDeleteGame()}
          testID="admin_delete_game_yes"
        />
      </View>
    </View>
  ) : null;

  const bg = showSure ? '#fbb' : '#fff';

  return (
    <Card
      title='Admin'
      containerStyle={{backgroundColor: bg}}
    >
      <Button
        title='Delete Game'
        buttonStyle={styles.button}
        disabled={showSure}
        onPress={() => setShowSure(true)}
        testID="admin_delete_game"
      />
      { areYouSure }
    </Card>
  );

};

export default Admin;


const styles = StyleSheet.create({
  button: {
    backgroundColor: 'red',
  },
  sure_txt: {
    paddingVertical: 10,
  },
  button_row: {
    flexDirection: 'row',
  },
  no_button: {
    flex: 1,
    paddingRight: 10,
  },
  yes_button: {
    flex: 1,
    paddingLeft: 10,
  },
});
