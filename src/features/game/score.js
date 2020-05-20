import React, { useContext, useState } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import {
  Card
} from 'react-native-elements';

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
});
