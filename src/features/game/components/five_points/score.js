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
      />
    );
  } else {
    content = (
      <TeamChooser
        currentHole={currentHole}
      />
    );
  }

  let holes = Array.from(Array(18).keys()).map(x => ++x);
  if( game.holes == 'front9' ) holes.length = 9;
  if( game.holes == 'back9' ) holes.splice(0, 9);

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

  },
  player_container: {
    padding: 15,
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
