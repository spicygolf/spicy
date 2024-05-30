import React from 'react';
import {
  SafeAreaView
} from 'react-native';
import GameList from './GameList';

function App(): React.JSX.Element {
  return (
    <SafeAreaView>
      <GameList />
    </SafeAreaView>
  );
}

export default App;
