import React, { useContext } from 'react';
import
{
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { DataTable } from 'react-native-paper';
import { filter, find } from 'lodash';

import { GameContext } from 'features/game/gameContext';
import { scoring } from 'common/utils/score';



const FivePointsLeaderboard = props => {

  const scoreType = 'gross'; // gross, net, points, ?

  const { game } = useContext(GameContext);
  const scores = scoring(game);

  const playerList = filter(game.players.map((p, i) => {
    if( !p ) return null;
    return ({
      key: i,
      pkey: p._key,
      name: p.name,
    });
  }), (p => p != null));

  const findScore = (hole, pkey) => {
    let ret = null;
    hole.teams.map(t => {
      const p = find(t.players, {pkey: pkey});
      if( p ) ret = p.score[scoreType];
    });
    return ret;
  };

  const header = () => {
    const players = playerList.map(p => {
      return (
        <DataTable.Title
          style={[styles.playerName, styles.rotate]}
          numberOfLines={2}
        >
          <Text>{ p.name }</Text>
        </DataTable.Title>
      );
    });
    return (
      <DataTable.Header style={styles.header}>
        <DataTable.Title style={styles.holeTitle}>Hole</DataTable.Title>
        { players }
      </DataTable.Header>
    );

  };

  const side = (holes, sideName) => {
    let totals = {};
    const ret = holes.map(h => {
      const scoreCells = playerList.map(p => {
        const score = findScore(h, p.pkey);
        if( !totals[p.pkey] ) totals[p.pkey] = 0;
        totals[p.pkey] += (parseFloat(score) || 0);
        return (
          <DataTable.Cell style={styles.scoreCell}>{score}</DataTable.Cell>
        );
      });
      return (
        <DataTable.Row style={styles.row}>
          <DataTable.Cell style={styles.holeCell}>{h.hole}</DataTable.Cell>
          { scoreCells }
        </DataTable.Row>
      );
    });
    const totalCells = playerList.map(p => (
      <DataTable.Cell style={styles.scoreCell}>{totals[p.pkey]}</DataTable.Cell>
    ));
    ret.push((
      <DataTable.Row style={styles.row}>
        <DataTable.Cell style={styles.holeCell}>{sideName}</DataTable.Cell>
        { totalCells }
      </DataTable.Row>
    ));
    return {
      rows: ret,
      totals: totals,
    };
  };

  const totalRows = totals => {
    const totalCells = playerList.map(p => (
      <DataTable.Cell style={styles.scoreCell}>{totals[p.pkey]}</DataTable.Cell>
    ));
    return (
      <DataTable.Row style={styles.row}>
        <DataTable.Cell style={styles.holeCell}>Total</DataTable.Cell>
        { totalCells }
      </DataTable.Row>
    )
  };

  const front = () => {
    const holes = scores.holes.filter(h => (parseInt(h.hole) <= 9));
    return side(holes, 'Front');
  };
  const { rows: frontRows, totals: frontTotals } = front();

  const back = () => {
    const holes = scores.holes.filter(h => (parseInt(h.hole) >= 10));
    return side(holes, 'Back');
  };
  const { rows: backRows, totals: backTotals } = back();

  let totals = {};
  playerList.map(p => {
    if( !totals[p.pkey] ) totals[p.pkey] = 0;
    totals[p.pkey] += parseFloat(frontTotals[p.pkey] + parseFloat(backTotals[p.pkey]));
  });

  return (
    <View style={styles.container}>
      <DataTable>
        { header() }
        <ScrollView style={styles.rows}>
          { frontRows }
          { backRows }
          { totalRows(totals) }
        </ScrollView>
      </DataTable>
    </View>
  );

}

export default FivePointsLeaderboard;

const headerHeight = 100;
const rowHeight = 28;

var styles = StyleSheet.create({
  container: {
    margin: 10,
    height: '100%',
    paddingBottom: 60, // for the bottom-tabs... grrr
  },
  header: {
    height: headerHeight,
    alignItems: 'center',
    flexShrink: 1,
  },
  holeTitle: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    height: headerHeight,
    flex: 1,
    //borderWidth: 1,
  },
  rotate: {
    transform: [{ rotate: '270deg'}],
  },
  playerName: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: headerHeight,
    flex: 1,
    //borderWidth: 1,
  },
  rows: {
    marginBottom: 50,
  },
  row: {
    minHeight: rowHeight,
    height: rowHeight,
  },
  holeCell: {
    flex: 1,
    height: rowHeight,
  },
  scoreCell: {
    margin: 0,
    padding: 0,
    justifyContent: 'center',
    flex: 1,
    height: rowHeight,
  },
});
