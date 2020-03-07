import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { find } from 'lodash';



const TeamTotals = props => {

  const { team: teamNum, scoring, currentHole } = props;

  const hole = find(scoring.holes, { hole: currentHole });
  if( !hole ) return null;

  const team = find(hole.teams, {team: teamNum});
  if( !team ) return null;

  return (
  <View style={styles.totalsView}>
    <View>
      <Text style={styles.totalsText}>Hole: {team.holeTotal}</Text>
    </View>
    <View>
      <Text style={styles.totalsText}>Total: {team.runningTotal}</Text>
    </View>
  </View>
);
};

export default TeamTotals;


const styles = StyleSheet.create({
  totalsView: {
    flexDirection: 'row',
    flex: 2,
    justifyContent: 'space-around',
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
  },
  totalsText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});