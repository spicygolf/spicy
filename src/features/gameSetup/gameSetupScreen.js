import { useNavigation } from '@react-navigation/native';
import { GameContext } from 'features/game/gameContext';
import Admin from 'features/gameSetup/admin';
import Options from 'features/gameSetup/options';
import Players from 'features/gameSetup/players';
import Teams from 'features/gameSetup/teams';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import React, { useContext, useEffect } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';

const GameSetupScreen = (props) => {
  const { route } = props;
  const navigation = useNavigation();

  const { game } = useContext(GameContext);
  const { currentPlayer: cp } = useContext(CurrentPlayerContext);

  useEffect(() => {
    const init = async () => {
      if (route && route.params && route.params.addCurrentPlayerToGame) {
        console.log('adding current player to game');
        console.log('player', cp);
        console.log('game', game);
        navigation.navigate('LinkRoundList', { game, player: cp });
      }
    };
    init();
  }, [cp, game, navigation, route]);

  return (
    <KeyboardAvoidingView style={styles.container} testID="game_setup_kaview">
      <ScrollView keyboardShouldPersistTaps="handled" testID="game_setup_scrollview">
        <Players />
        <Teams />
        <Options />
        <Admin />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default GameSetupScreen;

const styles = StyleSheet.create({
  container: {
    height: '100%',
    paddingBottom: 10,
  },
});
