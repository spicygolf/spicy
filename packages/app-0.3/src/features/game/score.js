import TeamChooser from 'common/components/teamChooser';
import { getHoles, getLocalHoleInfo, isTeeSameForAllPlayers } from 'common/utils/game';
import { getGameMeta, setGameMeta } from 'common/utils/metadata';
import { getTeams } from 'common/utils/teams';
import { GameContext } from 'features/game/gameContext';
import HoleNav from 'features/game/holenav';
import Teams from 'features/game/teams';
import GameSummaryStack from 'features/gameSummary/gameSummaryStack';
import { filter, find } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Card, Icon } from 'react-native-elements';

const Score = (props) => {
  const { game, gkey, scores } = useContext(GameContext);
  const [currentHole, setCurrentHole] = useState('1');

  let content = null;
  let holeInfo = { hole: currentHole };

  const hole = find(scores.holes, { hole: currentHole });

  // TODO: ScoreWarnings as its own component?
  const warnings =
    hole && hole.warnings
      ? hole.warnings.map((w, i) => (
          <View key={`warning_${i}`} style={styles.warning}>
            <Icon
              key={`icon_${i}`}
              name="alert-outline"
              type="material-community"
              color="#666"
              size={24}
              iconStyle={styles.warningIcon}
            />
            <Text key={`text_${i}`} style={styles.warningTxt}>
              {w}
            </Text>
          </View>
        ))
      : [];
  const warningsContent =
    warnings && warnings.length ? <View style={styles.warnings}>{warnings}</View> : null;

  const teams = getTeams(game, currentHole);
  //console.log('teams', teams);

  const clearHoleFromHolesToUpdate = async () => {
    const gameMeta = await getGameMeta(gkey);
    if (!(gameMeta && gameMeta.holesToUpdate)) {
      return;
    }
    const newHoles = filter(gameMeta.holesToUpdate, (h) => h !== currentHole);
    await setGameMeta(gkey, 'holesToUpdate', newHoles);
  };

  if (currentHole) {
    holeInfo = isTeeSameForAllPlayers({ game })
      ? getLocalHoleInfo({ game, currentHole })
      : { hole: currentHole };

    if (teams) {
      clearHoleFromHolesToUpdate();
      content = <Teams teams={teams} scoring={scores} currentHole={currentHole} />;
    } else if (currentHole === 'Summary') {
      content = <GameSummaryStack />;
    } else {
      content = (
        <Card>
          <Card.Title>Choose Teams</Card.Title>
          <Card.Divider />
          <TeamChooser currentHole={currentHole} from="score" />
        </Card>
      );
    }
  } else {
    content = (
      <View>
        <ActivityIndicator />
      </View>
    );
  }
  const holes = getHoles(game);

  useEffect(() => {
    const init = async () => {
      const gameMeta = await getGameMeta(gkey);
      if (!gameMeta || !gameMeta.currentHole) {
        setCurrentHole('1');
      } else {
        setCurrentHole(gameMeta.currentHole);
      }
    };
    init();
  }, [gkey]);

  return (
    <View style={styles.score_container}>
      <HoleNav
        holes={holes}
        holeInfo={holeInfo}
        changeHole={async (h) => {
          await setGameMeta(gkey, 'currentHole', h);
          setCurrentHole(h);
        }}
      />
      {warningsContent}
      <View style={styles.content_container}>{content}</View>
    </View>
  );
};

export default Score;

var styles = StyleSheet.create({
  content_container: {
    flex: 1,
  },
  score_container: {
    flex: 1,
    padding: 5,
  },
  warning: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  warningIcon: {},
  warningTxt: {
    color: '#666',
    paddingLeft: 5,
  },
  warnings: {
    backgroundColor: 'yellow',
    borderColor: '#ddd',
    borderWidth: 2,
    marginHorizontal: 9,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
});
