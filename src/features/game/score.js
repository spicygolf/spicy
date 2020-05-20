import React, { useContext, useState } from 'react';
import {
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
import { GameContext } from 'features/game/gameContext';
import { getHoles } from 'common/utils/game';



const Score = props => {

  const { game, scores } = useContext(GameContext);
  const [ currentHole, setCurrentHole ] = useState('1');


  let content = null;

  const hole = find(scores.holes, {hole: currentHole});
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

  if( teams ) {
    content = (
      <Teams
        teams={teams}
        scoring={scores}
        currentHole={currentHole}
      />
    );
  } else {
    content = (
      <Card title='Choose Teams'>
        <TeamChooser
          currentHole={currentHole}
        />
      </Card>
    );
  }

  const holes = getHoles(game);
  //console.log('holes', holes);

  return (
    <View style={styles.score_container}>
      <HoleNav
        holes={holes}
        currentHole={currentHole}
        changeHole={hole => setCurrentHole(hole)}
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
