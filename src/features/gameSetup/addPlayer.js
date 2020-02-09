import React from 'react';
import {
  StyleSheet,
  View
} from 'react-native';

import GameNav from 'features/games/gamenav';
import AddPlayerTabs from 'features/gameSetup/addPlayerTabs';
import { AddPlayerContext } from 'features/gameSetup/addPlayerContext';



const AddPlayer = props => {

  const { route } = props;
  const { team } = route.params;
  //console.log('AddPlayer team', team);

  return (
    <View style={styles.container}>
      <GameNav
        title='Add Player'
        showBack={true}
        backTo={'GameSetup'}
      />
      <AddPlayerContext.Provider value={{team: team}}>
        <AddPlayerTabs />
      </AddPlayerContext.Provider>
    </View>
  );

};

export default AddPlayer;


const styles = StyleSheet.create({
  container: {
    flex: 1
  },
});
