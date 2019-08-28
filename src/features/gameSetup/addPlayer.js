import React from 'react';
import {
  StyleSheet,
  View
} from 'react-native';

import GameNav from 'features/games/gamenav';

import AddPlayerTabs from 'features/gameSetup/addPlayerTabs';



class AddPlayer extends React.Component {

  // https://stackoverflow.com/questions/54038075/v1-to-v3-migration-nested-tabs
  static router = {
    ...AddPlayerTabs.router,
    getStateForAction: (action, lastState) => {
      return AddPlayerTabs.router.getStateForAction(action, lastState);
    },
  };

  constructor(props) {
    super(props);
    //console.log('addPlayer props', props);
  }

  render() {
    return (
      <View style={styles.container}>
        <GameNav
          title='Add Player'
          showBack={true}
          backTo={'GameSetup'}
        />
        <AddPlayerTabs
          navigation={this.props.navigation}
          screenProps={this.props.screenProps}
        />
      </View>
    );
  }

}



export default AddPlayer;


const styles = StyleSheet.create({
  container: {
    flex: 1
  },
});
