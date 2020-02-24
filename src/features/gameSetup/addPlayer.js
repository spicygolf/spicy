import React from 'react';
import {
  StyleSheet,
  View
} from 'react-native';

import GameNav from 'features/games/gamenav';
import AddPlayerTabs from 'features/gameSetup/addPlayerTabs';



const AddPlayer = props => {

  return (
    <View style={styles.container}>
      <GameNav
        title='Add Player'
        showBack={true}
        backTo={'GameSetup'}
      />
      <AddPlayerTabs />
    </View>
  );

};

export default AddPlayer;


const styles = StyleSheet.create({
  container: {
    flex: 1
  },
});
