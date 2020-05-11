import React, { useContext, useState } from 'react';
import
{
  SectionList,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Icon } from 'react-native-elements';
import { Dropdown } from 'react-native-material-dropdown';
import { find, last, orderBy } from 'lodash';

import { GameContext } from 'features/game/gameContext';
import { playerListIndividual, playerListWithTeams } from 'common/utils/game';



const Leaderboard = props => {

  const { activeChoices, initialScoreType, teams } = props;
  const [ scoreType, setScoreType ] = useState(initialScoreType || 'gross');

  const { game, scores } = useContext(GameContext);

  const playerList = teams
    ? playerListWithTeams({game, scores})
    : playerListIndividual({game});
  const orderedPlayerList = orderBy(playerList, ['team']);

  const findScore = (hole, pkey) => {
    let ret = null;
    if( !hole || !hole.teams ) return ret;
    hole.teams.map(t => {
      const p = find(t.players, {pkey: pkey});
      if( p ) ret = p.score;
    });
    return ret;
  };

  // TODO: Inject format fn in with higher-level Leaderboard components?
  const format = v => {
    if( scoreType === 'points' && parseFloat(v) > 0 ) return `+${v}`;
    if( scoreType === 'match' ) {
      if( v && v.toString().includes('&') ) return v;
      if( parseFloat(v) < 0 ) return '';
      if( parseFloat(v) > 0 ) return `${v} up`;
      if( parseFloat(v) == 0 ) return 'AS';
    }
    return v;
  };

  const side = (holes, side) => {
    let totals = {};
    const rows = holes.map(h => {
      const scores = orderedPlayerList.map((p) => {
        const score = findScore(h, p.pkey);
        if( !totals[p.pkey] ) totals[p.pkey] = 0;
        if( score ) totals[p.pkey] += (parseFloat(score[scoreType]) || 0);
        const team = find(h.teams, {team: p.team})
        return {
          pkey: p.pkey,
          score: {
            ...score,
            match: team.matchOver ? null : team.matchDiff
          },
          team: team.team
        };
      });
      return {
        hole: h.hole,
        scores,
      };
    });
    if( scoreType === 'match' ) {
      const lastRow = last(rows);
      lastRow.scores.map(s => {
        totals[s.pkey] = s.score.match;
      });
    }
    console.log('totals', side, totals, rows);
    return {
      side,
      data: rows,
      totals,
    };

  };

  const front = d => {
    const holes = scores.holes.filter(h => (parseInt(h.hole) <= 9));
    return side(holes, 'Out');
  };

  const back = () => {
    const holes = scores.holes.filter(h => (parseInt(h.hole) >= 10));
    return side(holes, 'In');
  };

  const Row = ({row}) => {
    const scoreCells = row.scores.map(s => {
      if( !s.score ) return null;
      return (
        <View key={`cell_${row.hole}_${s.pkey}`} style={styles.scorePopContainer}>
          <View style={styles.scoreView}>
            <Text style={styles.scoreCell}>{format(s.score[scoreType]) || '  '}</Text>
          </View>
          <View style={styles.popView}>
            <Icon
              name='lens'
              color={ s.score.pops > 0 ? 'black' : '#eee' }
              size={5}
            />
          </View>
        </View>
      );
    });

    return (
      <View key={`row_${row.hole}`} style={styles.row}>
        <View style={styles.holeCellView}>
          <Text style={styles.holeCell}>{row.hole}</Text>
        </View>
        { scoreCells }
      </View>
    );
  };

  const TotalRow = ({section}) => {
    const totalCells = orderedPlayerList.map(p => (
      <View key={`totalcell_${section.side}_${p.pkey}`} style={styles.scorePopContainer}>
        <View style={styles.scoreView}>
          <Text style={styles.scoreCell}>{format(section.totals[p.pkey])}</Text>
        </View>
      </View>
    ));
    return (
      <View key={`totalrow_${section.side}`} style={[styles.row, styles.totalRow]}>
        <View style={styles.holeCellView}>
          <Text style={styles.holeCell}>{section.side}</Text>
        </View>
        { totalCells }
      </View>
    );
  };

  const ViewChooser = props => {

    const { activeChoices } = props;

    const choices = activeChoices.map(c => ({value: c}));

    return (
      <Dropdown
        value={scoreType}
        data={choices}
        label='View'
        fontSize={12}
        onChangeText={text => {
          setScoreType(text);
        }}
      />
    );

  };

  const Header = () => {

    const players = orderedPlayerList.map(p => {
      return (
        <View key={`header_${p.pkey}`} style={[styles.playerNameView, styles.rotate]}>
          <Text
            style={styles.playerName}
            textBreakStrategy='simple'
          >{ p.name }</Text>
        </View>
      );
    });
    return (
      <View style={styles.header}>
        <View style={styles.holeTitleView}>
          <ViewChooser activeChoices={activeChoices} />
          <Text style={styles.holeTitle}>Hole</Text>
        </View>
        { players }
      </View>
    );

  };

  const Footer = () => {
    if( scoreType === 'match' ) return null;
    const section = {
      side: 'Total',
      totals: totals,
    };
    return (<TotalRow section={section} />);
  };

  const data = [];
  const f = front();
  data.push(f);
  const b = back();
  data.push(b);
  const totals = {};
  orderedPlayerList.map(p => {
    if( !totals[p.pkey] ) totals[p.pkey] = 0;
    totals[p.pkey] += ((parseFloat(f.totals[p.pkey]) || 0) + (parseFloat(b.totals[p.pkey]) || 0));
  });
  //console.log('data', data);

  return (
    <View style={styles.container}>
      <SectionList
        sections={data}
        keyExtractor={(item, index) => item+index}
        renderItem={({item}) => (<Row row={item} />)}
        renderSectionFooter={({ section }) => (<TotalRow section={section} />)}
        ListHeaderComponent={Header}
        ListFooterComponent={Footer}
      />
    </View>
  );

}

export default Leaderboard;

const headerHeight = 90;
const rowHeight = 26;

var styles = StyleSheet.create({
  container: {
    margin: 10,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    height: headerHeight,
    alignItems: 'center',
    //borderWidth: 1,
  },
  holeTitleView: {
    height: headerHeight,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    //borderWidth: 1,
  },
  holeTitle: {
    paddingBottom: 10,
    alignSelf: 'center',
    color: '#666',
  },
  chooserText: {
    fontSize: 12,
  },
  rotate: {
    transform: [{ rotate: '270deg'}],
  },
  playerNameView: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    //borderWidth: 1,
  },
  playerName: {
    paddingLeft: 10,
    maxWidth: headerHeight,
    width: headerHeight,
    color: '#666',
    //borderWidth: 1,
  },
  row: {
    minHeight: rowHeight,
    height: rowHeight,
    flexDirection: 'row',
    paddingVertical: 5,
  },
  holeCellView: {
    flex: 1,
    height: rowHeight,
    alignItems: 'center',
    //borderWidth: 1,
  },
  holeCell: {
    color: '#666',
  },
  scoreCell: {
    margin: 0,
    padding: 0,
    height: rowHeight,
    paddingRight: 5,
  },
  scorePopContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  scoreView: {
    alignItems: 'flex-end',
    flex: 0.65,
  },
  popView: {
    alignItems: 'flex-start',
    flex: 0.35,
  },
  totalRow: {
    paddingVertical: 5,
    backgroundColor: '#ddd',
  },
});
