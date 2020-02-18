import React, { useContext, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getTeams } from 'common/utils/teams';
import HoleScore from 'common/components/holeScore';
import HoleJunk from 'common/components/holeJunk';
import HoleNav from 'features/game/holenav';
import Teams from 'features/games/teams';
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

    let handicap = 'NH';
    const index = (item && item.handicap && item.handicap.display) ?
      item.handicap.display : null;
    if( round ) {
      handicap = round.game_handicap ?
        round.game_handicap : round.course_handicap;
      handicap = handicap ? handicap.toString() : 'NH';
    }

    //console.log('FivePointsScore round', round);
    // TODO: if Round is null here, we need to Link / Create a round
    const score = get_score(currentHole, round);
    const rkey = (round && round._key) ? round._key : null;
    //console.log('score', score);

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
            <Text>{item.name || ''}</Text>
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
  if( gamespec.team_size && gamespec.team_size > 1 ) {
    const teams = getTeams(game.players, gamespec);
    //console.log('teams', teams);
    content = (
      <Teams
        teams={teams}
        players={game.players}
        gamespec={gamespec}
        renderPlayer={_renderPlayer}
      />
    );
  } else {
    content = (
      <FlatList
        data={game.players}
        renderItem={_renderPlayer}
        keyExtractor={item => item._key}
      />
    );
  }

  // TODO: get 9 or 18 from game / gameSetup somehow
  const holes = Array.from(Array(18).keys()).map(x => ++x);

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
    paddingTop: 15,
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
  },
  player_name: {
    flex: 1,
  },
  hole_score: {
    flex: 1,
  },
});
