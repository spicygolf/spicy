import { useLazyQuery, useMutation } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import { REMOVE_LINK_MUTATION } from 'common/graphql/unlink';
import { rmgame } from 'common/utils/game';
import { rmlink } from 'common/utils/links';
import { rmround } from 'common/utils/rounds';
import { GameContext } from 'features/game/gameContext';
import { DELETE_GAME_MUTATION, GET_DELETE_GAME_INFO_QUERY } from 'features/game/graphql';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { DELETE_ROUND_MUTATION } from 'features/rounds/graphql';
import { find } from 'lodash';
import React, { useContext, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Overlay } from 'react-native-elements';

const Admin = (props) => {
  const { gkey, game } = useContext(GameContext);
  const { currentPlayerKey } = useContext(CurrentPlayerContext);

  const navigation = useNavigation();

  const [showSure, setShowSure] = useState(false);

  const [unlink] = useMutation(REMOVE_LINK_MUTATION);
  const [deleteGame] = useMutation(DELETE_GAME_MUTATION);
  const [deleteRound] = useMutation(DELETE_ROUND_MUTATION);

  const [getDeleteGameInfo, { loading, error, data }] = useLazyQuery(
    GET_DELETE_GAME_INFO_QUERY,
    {
      variables: {
        gkey: gkey,
      },
      fetchPolicy: 'no-cache',
    },
  );
  if (loading) return <ActivityIndicator />;
  if (error && error.message != 'Network request failed') {
    console.log('Error getting deleteGameInfo', error);
  }
  //console.log('dgiRes in function body', dgiRes);

  const doDeleteGame = async () => {
    const dgiRes = data && data.getDeleteGameInfo ? data.getDeleteGameInfo : null;
    //console.log('dgiRes in doDeleteGame', dgiRes);
    if (dgiRes == null) {
      console.error('No DeleteGameInfo available, cannot delete game');
      return;
    }

    const gkey = dgiRes._key;
    const dgi = dgiRes.deleteGameInfo;
    //console.log('deleteGame', gkey, dgi);

    // remove round2game links and rounds with no links to other games
    await dgi.rounds.map(async (r) => {
      await rmlink('round', r.vertex, 'game', gkey, unlink);
      if (r && r.other && r.other.length == 0) {
        //console.log('round to delete', r);
        // we need to delete round2player edge as well as round
        const gRound = find(game.rounds, { _key: r.vertex });
        if (gRound && gRound.player && gRound.player[0] && gRound.player[0]._key) {
          const rmR2P = await rmlink(
            'round',
            r.vertex,
            'player',
            gRound.player[0]._key,
            unlink,
          );
          //console.log('remove round2player', rmR2P);
        }
        const rmR = await rmround(r.vertex, deleteRound);
        //console.log('remove round', rmR);
      }
    });

    // remove player links
    await dgi.players.map(async (p) => {
      const rmP = await rmlink('player', p.vertex, 'game', gkey, unlink);
      //console.log('remove player', rmP);
    });

    // remove gamespec links
    await dgi.gamespecs.map(async (gs) => {
      const rmG2GS = await rmlink('game', gkey, 'gamespec', gs.vertex, unlink);
      //console.log('remove game2gamespec', rmG2GS);
    });

    // remove game
    const rmG = await rmgame(gkey, currentPlayerKey, deleteGame);
    //console.log('remove game', rmG);

    navigation.navigate('Games');
  };

  // render stuffs

  // TODO: we could show the rounds here, and give the user a choice as to
  // which ones they want to delete before deleting game.
  // They won't get the option to delete rounds linked to other games.
  const toggleOverlay = () => {
    setShowSure(!showSure);
  };

  const bg = showSure ? '#fbb' : '#fff';

  return (
    <View>
      <Card containerStyle={{ backgroundColor: bg }}>
        <Card.Title>Admin</Card.Title>
        <Card.Divider />
        <Button
          title="Delete Game"
          buttonStyle={styles.button}
          disabled={showSure}
          onPress={async () => {
            await getDeleteGameInfo();
            setShowSure(true);
          }}
          testID="admin_delete_game"
        />
      </Card>
      <Overlay isVisible={showSure} onBackdropPress={toggleOverlay}>
        <View>
          <Text style={styles.sure_txt}>Delete Game: Are you sure?</Text>
          <View style={styles.button_row}>
            <Button
              title="No"
              type="outline"
              onPress={toggleOverlay}
              containerStyle={styles.no_button}
            />
            <Button
              title="Yes"
              buttonStyle={styles.button}
              containerStyle={styles.yes_button}
              onPress={() => {
                doDeleteGame();
                toggleOverlay();
              }}
              testID="admin_delete_game_yes"
            />
          </View>
        </View>
      </Overlay>
    </View>
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
