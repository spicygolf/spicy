import { blue } from 'common/colors';
import { playerListIndividual, playerListWithTeams } from 'common/utils/game';
import { format } from 'common/utils/score';
import { shapeStyles } from 'common/utils/styles';
import { GameContext } from 'features/game/gameContext';
import { find, last, orderBy } from 'lodash';
import React, { useContext, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { ButtonGroup, Icon } from 'react-native-elements';

// TODO: please make distinct components for this massive shitstorm/rats nest
const Leaderboard = (props) => {
  const { activeChoices, initialScoreType, teams } = props;
  const [scoreType, setScoreType] = useState(initialScoreType || 'gross');

  const { game, scores } = useContext(GameContext);

  const playerList = teams
    ? playerListWithTeams({ game, scores })
    : playerListIndividual({ game });
  const orderedPlayerList = orderBy(playerList, ['team']);

  const findScore = (hole, pkey) => {
    let ret = null;
    if (!hole || !hole.teams) return ret;
    hole.teams.map((t) => {
      const p = find(t.players, { pkey: pkey });
      if (p) ret = p.score;
    });
    return ret;
  };

  const side = (holes, side) => {
    let totals = {};
    let isMatchOver = false;
    const rows = holes.map((h) => {
      const scores = orderedPlayerList.map((p) => {
        const score = findScore(h, p.pkey);
        if (!totals[p.pkey]) totals[p.pkey] = 0;
        if (score && score[scoreType])
          totals[p.pkey] += parseFloat(score[scoreType].value) || 0;
        let t = find(h.teams, { team: p.team });
        let team = null;
        if (t && t.team) team = t.team; // dafuq?
        let match = null;
        if (
          t &&
          !t.matchOver &&
          !isMatchOver &&
          h.scoresEntered == orderedPlayerList.length
        ) {
          // we have a team object, the match isn't over, and all scores are
          // entered for this hole, so we can set the match property
          match = t.matchDiff;
        }
        if (t && t.matchOver && t.win && !isMatchOver) {
          match = t.matchDiff;
          isMatchOver = true; // to not show the result for any more holes
        }

        return {
          pkey: p.pkey,
          score: {
            ...score,
            match: { value: match, toPar: null },
          },
          team,
        };
      });
      return {
        hole: h.hole,
        scores,
      };
    });
    if (scoreType === 'match') {
      const lastRow = last(rows);
      if (lastRow)
        lastRow.scores.map((s) => {
          totals[s.pkey] = s.score.match.value;
        });
    }
    //console.log('rows', side, rows);
    return {
      side,
      data: rows,
      totals,
    };
  };

  const front = (d) => {
    const holes = scores.holes.filter((h) => parseInt(h.hole) <= 9);
    return side(holes, 'Out');
  };

  const back = () => {
    const holes = scores.holes.filter((h) => parseInt(h.hole) >= 10);
    return side(holes, 'In');
  };

  const Row = ({ row }) => {
    const scoreCells = row.scores.map((s, i) => {
      if (!s.score || !s.score[scoreType]) {
        return <View key={`cell_${row.hole}_${i}`} style={styles.scorePopContainer} />;
      }
      const sv = s.score[scoreType].value;
      let pops = [];
      for (let i = 0; i < parseFloat(s.score.pops.value); i++) {
        pops.push(
          <Icon
            key={i}
            name="lens"
            color={s.score.pops.value > 0 ? 'black' : '#eee'}
            size={5}
            iconStyle={styles.pop}
          />,
        );
      }

      const birdieShape =
        sv && s.score[scoreType].toPar < 0
          ? [shapeStyles(rowHeight, 'black').circle]
          : scoreType == 'match' || scoreType == 'points'
          ? [shapeStyles(rowHeight, 'black').match]
          : [shapeStyles(rowHeight, 'black').none];

      const eagleShape =
        sv && s.score[scoreType].toPar < -1
          ? [shapeStyles(rowHeight - 5).circle]
          : scoreType == 'match' || scoreType == 'points'
          ? [shapeStyles(rowHeight - 5, 'black').match]
          : [shapeStyles(rowHeight - 5, 'black').none];

      const txt = (
        <Text style={styles.scoreCell}>
          {format({
            v: sv,
            type: scoreType,
            showDown: false,
          })}
        </Text>
      );

      return (
        <View key={`cell_${row.hole}_${s.pkey}`} style={styles.scorePopContainer}>
          <View style={styles.scoreView}>
            <View style={birdieShape}>
              <View style={eagleShape}>{txt}</View>
            </View>
          </View>
          <View style={styles.popView}>{pops}</View>
        </View>
      );
    });

    return (
      <View key={`row_${row.hole}`} style={styles.row}>
        <View style={styles.holeCellView}>
          <Text style={styles.holeCell}>{row.hole}</Text>
        </View>
        {scoreCells}
      </View>
    );
  };

  const TotalRow = ({ section }) => {
    const birdieShape =
      scoreType == 'match' || scoreType == 'points'
        ? [shapeStyles(rowHeight, 'black').match]
        : [shapeStyles(rowHeight, 'black').none];

    const eagleShape =
      scoreType == 'match' || scoreType == 'points'
        ? [shapeStyles(rowHeight - 5, 'black').match]
        : [shapeStyles(rowHeight - 5, 'black').none];

    const totalCells = orderedPlayerList.map((p) => (
      <View key={`totalcell_${section.side}_${p.pkey}`} style={styles.scorePopContainer}>
        <View style={styles.scoreView}>
          <View style={birdieShape}>
            <View style={eagleShape}>
              <Text style={styles.scoreCell} numberOfLines={1}>
                {format({
                  v: section.totals[p.pkey],
                  type: scoreType,
                })}
              </Text>
            </View>
          </View>
          <View style={styles.popView}></View>
        </View>
      </View>
    ));
    return (
      <View key={`totalrow_${section.side}`} style={[styles.row, styles.totalRow]}>
        <View style={styles.holeCellView}>
          <Text style={styles.holeCell}>{section.side}</Text>
        </View>
        {totalCells}
      </View>
    );
  };

  const ViewChooser = (props) => {
    const { activeChoices } = props;

    const selected = activeChoices.indexOf(scoreType);

    return (
      <ButtonGroup
        buttons={activeChoices}
        selectedIndex={selected}
        onPress={(index) => {
          setScoreType(activeChoices[index]);
        }}
        containerStyle={styles.buttonContainer}
        selectedButtonStyle={styles.selectedButton}
        textStyle={styles.buttonText}
        selectedTextStyle={styles.selectedButtonText}
      />
    );
  };

  const Header = () => {
    const players = orderedPlayerList.map((p) => {
      return (
        <View key={`header_${p.pkey}`} style={[styles.playerNameView, styles.rotate]}>
          <Text style={styles.playerName} textBreakStrategy="simple" numberOfLines={2}>
            {p.name}
          </Text>
        </View>
      );
    });
    return (
      <View>
        <View style={styles.header}>
          <View style={styles.holeTitleView}>
            <Text style={styles.holeTitle}>Hole</Text>
          </View>
          {players}
        </View>
      </View>
    );
  };

  const Footer = () => {
    if (scoreType === 'match') return null;
    const section = {
      side: 'Total',
      totals: totals,
    };
    return <TotalRow section={section} />;
  };

  const data = [];
  const f = front();
  data.push(f);
  const b = back();
  data.push(b);
  const totals = {};
  orderedPlayerList.map((p) => {
    if (!totals[p.pkey]) totals[p.pkey] = 0;
    totals[p.pkey] +=
      (parseFloat(f.totals[p.pkey]) || 0) + (parseFloat(b.totals[p.pkey]) || 0);
  });
  //console.log('data', data);

  return (
    <View style={styles.container}>
      <ViewChooser activeChoices={activeChoices} />
      <SectionList
        sections={data}
        keyExtractor={(item, index) => item + index}
        renderItem={({ item }) => <Row row={item} />}
        renderSectionFooter={({ section }) => <TotalRow section={section} />}
        ListHeaderComponent={Header}
        ListFooterComponent={Footer}
      />
    </View>
  );
};

export default Leaderboard;

const headerHeight = 75;
const rowHeight = 26;

var styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    flex: 1,
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
    alignSelf: 'center',
    color: '#666',
  },
  buttonContainer: {
    maxHeight: 24,
    zIndex: 5,
  },
  selectedButton: {
    backgroundColor: blue,
  },
  buttonText: {
    fontSize: 12,
  },
  selectedButtonText: {
    color: 'white',
  },
  rotate: {
    transform: [{ rotate: '270deg' }],
  },
  playerNameView: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    //borderWidth: 1,
  },
  playerName: {
    maxWidth: headerHeight,
    width: headerHeight,
    color: '#666',
    //borderWidth: 1,
  },
  row: {
    minHeight: rowHeight,
    height: rowHeight,
    flexDirection: 'row',
    //paddingVertical: 5,
  },
  holeCellView: {
    flex: 1,
    height: rowHeight,
    alignItems: 'center',
    justifyContent: 'center',
    //borderWidth: 1,
  },
  holeCell: {
    color: '#666',
    fontSize: 13,
  },
  scorePopContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  scoreView: {
    alignItems: 'flex-end',
    flex: 0.8,
  },
  scoreCell: {
    fontSize: 13,
    textAlign: 'right',
    marginRight: 10,
    paddingRight: 10,
    minWidth: 40,
  },
  popView: {
    alignItems: 'flex-start',
    paddingTop: 3,
    flex: 0.2,
  },
  pop: {
    paddingVertical: 0.5,
  },
  totalRow: {
    backgroundColor: '#ddd',
  },
});
