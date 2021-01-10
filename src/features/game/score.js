import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Card,
  Icon,
} from 'react-native-elements';
import { find } from 'lodash';

import { getTeams } from 'common/utils/teams';
import TeamChooser from 'common/components/teamChooser';
import HoleNav from 'features/game/holenav';
import Teams from 'features/game/teams';
import GameSummaryStack from 'features/gameSummary/gameSummaryStack';
import { GameContext } from 'features/game/gameContext';
import { getHoles, getLocalHoleInfo } from 'common/utils/game';
import { getGameMeta, setGameMeta } from 'common/utils/metadata';



const Score = props => {

  const { game, gkey, scores, activeGameSpec } = useContext(GameContext);
  const [ currentHole, setCurrentHole ] = useState();

  let content = null;
  let holeInfo = {hole: currentHole};

  const hole = find(scores.holes, {hole: currentHole});

  // TODO: ScoreWarnings as its own component?
  const warnings = ( hole && hole.warnings )
    ? hole.warnings.map((w, i) => (
        <View key={`warning_${i}`}style={styles.warning}>
          <Icon
            key={`icon_${i}`}
            name='alert-outline'
            type='material-community'
            color='#666'
            size={24}
            iconStyle={styles.warningIcon}
          />
          <Text key={`text_${i}`} style={styles.warningTxt}>{w}</Text>
        </View>
      ))
    : [];
  const warningsContent = ( warnings && warnings.length )
    ? (<View style={styles.warnings}>{warnings}</View>)
    : null;

  const teams = getTeams(game, currentHole);
  //console.log('teams', teams);

  if( currentHole ) {
    if( teams ) {
      holeInfo = ( activeGameSpec && activeGameSpec.location_type && activeGameSpec.location_type == 'local' )
        ? getLocalHoleInfo({game, currentHole})
        : {hole: currentHole};

      content = (
        <Teams
          teams={teams}
          scoring={scores}
          currentHole={currentHole}
        />
      );
    } else if( currentHole === 'Summary' ) {
      content = (
        <GameSummaryStack />
      );
    } else {
      content = (
        <Card>
          <Card.Title>Choose Teams</Card.Title>
          <Card.Divider />
          <TeamChooser
            currentHole={currentHole}
            from='score'
          />
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
  //console.log('holes', holes);

  useEffect(
    () => {
      const init = async () => {
        const gameMeta = await getGameMeta(gkey);
        //console.log('meta', gameMeta);
        if( !gameMeta || !gameMeta.currentHole ) {
          setCurrentHole('1');
        } else {
          setCurrentHole(gameMeta.currentHole);
        }
      };
      init();
    }, []
  );

  return (
    <View style={styles.score_container}>
      <HoleNav
        holes={holes}
        holeInfo={holeInfo}
        changeHole={async hole => {
          await setGameMeta(gkey, 'currentHole', hole);
          setCurrentHole(hole);
        }}
      />
      {warningsContent}
      <View style={styles.content_container}>
        {content}
      </View>
    </View>
  );

};

export default Score;


var styles = StyleSheet.create({
  score_container: {
    padding: 5,
    flex: 1,
  },
  content_container: {
    flex: 1,
  },
  warnings: {
    marginHorizontal: 9,
    paddingVertical: 2,
    paddingHorizontal: 5,
    backgroundColor: 'yellow',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIcon: {

  },
  warningTxt: {
    paddingLeft: 5,
    color: '#666',
  },
});
