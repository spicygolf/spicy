import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { filter, find } from 'lodash';

import { formatDiff } from 'common/utils/score';



const TeamTotals = props => {

  const { team: teamNum, scoring, currentHole } = props;

  const hole = find(scoring.holes, { hole: currentHole });
  if( !hole ) return null;

  const team = find(hole.teams, {team: teamNum});
  if( !team ) return null;

  let otherTeam = null;
  const otherTeams = filter(hole.teams,
    t => (t.team.toString() != teamNum.toString())
  );
  if( otherTeams && otherTeams.length == 1 ) otherTeam = otherTeams[0];
  //console.log('teamTotals', teamNum, otherTeams, otherTeam);
  const diff = otherTeam ? team.runningTotal - otherTeam.runningTotal : null;

  return (
  <View style={styles.totalsView}>
    <View>
      <Text style={styles.totalsText}>Hole: {`${team.points} x ${hole.holeMultiplier} = ${team.holeTotal}`}</Text>
    </View>
    <View>
      <Text style={styles.totalsText}>Total: {team.runningTotal} ({formatDiff(diff)})</Text>
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
    //fontWeight: 'bold',
    //fontSize: 16,
  },
});