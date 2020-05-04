import React, { useContext, useState } from 'react';
import
{
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Icon } from 'react-native-elements';
import { Dropdown } from 'react-native-material-dropdown';
import { filter, find } from 'lodash';

import { GameContext } from 'features/game/gameContext';



const FivePointsLeaderboard = props => {

  const [ scoreType, setScoreType ] = useState('gross');

  const { game, scores } = useContext(GameContext);

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
    if( !hole || !hole.teams ) return ret;
    hole.teams.map(t => {
      const p = find(t.players, {pkey: pkey});
      if( p ) ret = p.score;
    });
    return ret;
  };

  const format = v => {
    console.log('format', scoreType, v);
    if( scoreType === 'points' && parseFloat(v) > 0 ) return `+${v}`;
    return v;
  };

  const side = (holes, side) => {
    const totals = {};
    const rows = holes.map(h => {
      const scores = playerList.map((p, i) => {
        const score = findScore(h, p.pkey);
        if( !totals[p.pkey] ) totals[p.pkey] = 0;
        totals[p.pkey] += (parseFloat(score[scoreType]) || 0);
        return { pkey: p.pkey, score };
      });
      return {
        hole: h.hole,
        scores: scores,
      };
    });

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
      //console.log(scoreType, score.score[scoreType]);
      return (
        <View style={styles.scorePopContainer}>
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
      <View style={styles.row}>
        <View style={styles.holeCellView}>
          <Text style={styles.holeCell}>{row.hole}</Text>
        </View>
        { scoreCells }
      </View>
    );
  };

  const TotalRow = ({section}) => {
    const totalCells = playerList.map(p => (
      <View style={styles.scorePopContainer}>
        <View style={styles.scoreView}>
          <Text style={styles.scoreCell}>{format(section.totals[p.pkey])}</Text>
        </View>
      </View>
    ));
    return (
      <View style={[styles.row, styles.totalRow]}>
        <View style={styles.holeCellView}>
          <Text style={styles.holeCell}>{section.side}</Text>
        </View>
        { totalCells }
      </View>
    );
  };

  const ViewChooser = props => {

    const choices = [
      {value: 'gross'},
      {value: 'net'},
      {value: 'points'},
    ];

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

    const players = playerList.map(p => {
      return (
        <View style={[styles.playerNameView, styles.rotate]}>
          <Text
            style={styles.playerName}
            numberOfLines={2}
          >{ p.name }</Text>
        </View>
      );
    });
    return (
      <View style={styles.header}>
        <View style={styles.holeTitleView}>
          <ViewChooser />
          <Text style={styles.holeTitle}>Hole</Text>
        </View>
        { players }
      </View>
    );

  };

  const Footer = () => {
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
  playerList.map(p => {
    if( !totals[p.pkey] ) totals[p.pkey] = 0;
    totals[p.pkey] += ((parseFloat(f.totals[p.pkey]) || 0) + (parseFloat(b.totals[p.pkey]) || 0));
  });
  console.log('data', data);

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

export default FivePointsLeaderboard;

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
  },
  chooserText: {
    fontSize: 12,
  },
  rotate: {
    transform: [{ rotate: '270deg'}],
  },
  playerNameView: {
    width: headerHeight,
    flex: 1,
    alignSelf: 'center',
    //borderWidth: 1,
  },
  playerName: {
    paddingLeft: 10,
    maxWidth: headerHeight,
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
