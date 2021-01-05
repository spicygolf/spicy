import React, { useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { filter, find } from 'lodash';

import { format } from 'common/utils/score';
import { GameContext } from 'features/game/gameContext';



const TeamTotals = props => {

  const { team: teamNum, scoring, currentHole, type, betterPoints } = props;
  const { game } = useContext(GameContext);

  const hole = find(scoring.holes, { hole: currentHole });
  if( !hole ) return null;

  const team = find(hole.teams, {team: teamNum});
  if( !team ) return null;

  let netPoints = team.points;
  let otherTeam = null;
  const otherTeams = filter(hole.teams,
    t => (t.team.toString() != teamNum.toString())
  );
  if( otherTeams && otherTeams.length == 1 ) {
    otherTeam = otherTeams[0];
    netPoints = team.points - otherTeam.points;
    if( betterPoints === 'lower' ) netPoints *= -1;
    if( netPoints < 0 ) netPoints = 0;
  }
  const netTotal = netPoints * hole.holeMultiplier;
  let diff = otherTeam ? team.runningTotal - otherTeam.runningTotal : team.runningTotal;
  if( betterPoints === 'lower' ) diff *= -1;
  const points = (netPoints == 0)
    ? '-'
    : netPoints;
  const multiplier = (hole.holeMultiplier == 1 || netPoints == 0 )
    ? ''
    : `x ${hole.holeMultiplier} = ${netTotal}`;

  let totalTxt = format({v: diff, type});
  if( totalTxt == '' && type == 'points' ) totalTxt = '0';
  let total = `Total: ${totalTxt}`;

  // handle totals differently for match play
  if( type === 'match' && team.matchOver ) {
    if( team.win ) {
      total = `Win: ${format({v: team.matchDiff, type})}`;
    } else {
      total = ``;
    }
  }
  // don't show team totals if the teams are rotating at all
  if( type !== 'match' && game.scope.teams_rotate !== 'never' ) {
    total = ``;
  }

  return (
  <View style={styles.totalsView}>
    <View>
      <Text style={styles.totalsText}>Hole: {`${points} ${multiplier}`}</Text>
    </View>
    <View>
      <Text style={styles.totalsText}>{total}</Text>
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