import React from 'react';
import {
  SafeAreaView
} from 'react-native';
// import GameList from './GameList';
import TestGame from './TestGame';

function App(): React.JSX.Element {
  return (
    <SafeAreaView>
      {/* <GameList /> */}
      <TestGame />
    </SafeAreaView>
  );
}

export default App;
