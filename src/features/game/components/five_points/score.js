import React, { useContext, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Card
} from 'react-native-elements';

import { getTeams } from 'common/utils/teams';
import TeamChooser from 'common/components/teamChooser';
import HoleScore from 'common/components/holeScore';
import HoleJunk from 'common/components/holeJunk';
import HoleNav from 'features/game/holenav';
import Teams from 'features/game/teams';
import { GameContext } from 'features/game/gameContext';
import {
  get_hole,
  get_round_for_player,
  get_score,
} from 'common/utils/rounds';
import { getHoles } from 'common/utils/game';
import { scoring } from 'common/utils/score';



const FivePointsScore = props => {

  const { game, gamespec } = useContext(GameContext);
  const [ currentHole, setCurrentHole ] = useState('1');


  const _renderPlayer = ({item}) => {
    const round = get_round_for_player(game.rounds, item._key);

    const hole = get_hole(currentHole, round);

    let handicap = '';
    if( round ) {
      handicap = round.game_handicap ?
        round.game_handicap : round.course_handicap;
      handicap = handicap ? handicap.toString() : '';
    }

    const score = get_score(currentHole, round);
    const rkey = (round && round._key) ? round._key : null;

    const holeScore = hole ? (
      <HoleScore
        hole={hole}
        score={score}
        rkey={rkey}
      />
    ) : null;

    const holeJunk = hole ? (
      <HoleJunk
        hole={hole}
        score={score}
        rkey={rkey}
      />
    ) : null;

    return (
      <View style={styles.player_container}>
        <View style={styles.player_score_container}>
          <View style={styles.player_name}>
            <Text style={styles.player_name_txt}>{item.name || ''}</Text>
            <Text>{handicap}</Text>
          </View>
          <View style={styles.hole_score}>
            {holeScore}
          </View>
        </View>
        <View style={styles.player_junk_container}>
          {holeJunk}
        </View>
      </View>
    );

  };

  let content = null;

  const teams = getTeams(game, currentHole);
  //console.log('teams', teams);

  if( teams ) {
    content = (
      <Teams
        teams={teams}
        renderPlayer={_renderPlayer}
        scoring={scoring()}
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

export default FivePointsScore;


var styles = StyleSheet.create({
  score_container: {
    padding: 5,
  },
  content_container: {
    // TODO: any way to create this buffer for the bottom nav buttons?
    paddingBottom: 80,
  },
  player_container: {
    padding: 15,
    paddingRight: 15,
    paddingTop: 10,
    paddingBottom: 10,
  },
  player_score_container: {
    flexDirection: 'row',
    flex: 2,
  },
  player_junk_container: {
    paddingTop: 5,
    flex: 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  player_name: {
    flex: 1,
  },
  player_name_txt: {
    fontSize: 16,
  },
  hole_score: {
    flex: 1,
  },
});
