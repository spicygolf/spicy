import React, { useContext, useEffect } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { GameContext } from 'features/game/gameContext';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import Players from 'features/gameSetup/players';
import Teams from 'features/gameSetup/teams';
import Options from 'features/gameSetup/options';
import Admin from 'features/gameSetup/admin';



const GameSetupScreen = props => {

  const { route } = props;
  const navigation = useNavigation();

  const { game } = useContext(GameContext);
  const { currentPlayer: cp } = useContext(CurrentPlayerContext);
  const admin = (cp && cp.level && cp.level == 'admin' )
    ? (<Admin />)
    : null;

  useEffect(
    () => {
      const init = async () => {
        if( route && route.params && route.params.addCurrentPlayerToGame ) {
          console.log('adding current player to game');
          console.log('player', cp);
          console.log('game', game);
          navigation.navigate('LinkRoundList', {game, player: cp});
        }
      };
      init();
    }, []
  );

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView>
        <Players />
        <Teams />
        <Options />
        { admin }
      </KeyboardAwareScrollView>
    </View>
  );

};

export default GameSetupScreen;


const styles = StyleSheet.create({
  container: {
    height: '100%',
    paddingBottom: 10,
  },
});
