import React from 'react';

import
{
  StyleSheet,
  Text,
  View
} from 'react-native';



const FivePointsLeaderboard = props => {

  return (
    <View style={styles.LeaderboardContainer}>
      <Text>FivePoints Leaderboard</Text>
    </View>
  );

}

export default FivePointsLeaderboard;


var styles = StyleSheet.create({
  LeaderboardContainer: {
    margin: 10
  },
});
