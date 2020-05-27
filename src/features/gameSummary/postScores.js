import React, { useContext, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';
import {
  Button,
} from 'react-native-elements';
import { orderBy } from 'lodash';

import GameNav from 'features/games/gamenav';
import { GameContext } from 'features/game/gameContext';
import PostScore from 'features/gameSummary/postScore';



const PostScores = props => {

  const { scores } = useContext(GameContext);
  const sorted_players = orderBy(scores.players, ['gross'], ['asc']);

  const [ currentPlayerIndex, setCurrentPlayerIndex ] = useState(0);

  const currentPlayer = sorted_players[currentPlayerIndex];

  const prev = (
    <Button
      title='Previous'
      buttonStyle={styles.button}
      titleStyle={styles.button_title}
      disabled={( currentPlayerIndex == 0 )}
      onPress={() => {
        let cpi = currentPlayerIndex - 1;
        if( cpi < 0 ) cpi = 0;
        setCurrentPlayerIndex(cpi);
      }}
    />
  );

  const next = (
    <Button
      title='Next'
      buttonStyle={styles.button}
      titleStyle={styles.button_title}
      disabled={( currentPlayerIndex == (sorted_players.length - 1) )}
      onPress={() => {
        let cpi = currentPlayerIndex + 1;
        if( cpi > sorted_players.length - 1 ) cpi = sorted_players.length - 1;
        setCurrentPlayerIndex(cpi);
      }}
    />
  );

  return (
    <View>
      <GameNav
          title='Post Scores'
          showBack={true}
          showScore={false}
      />
      <PostScore
        player={currentPlayer}
      />
      <View style={styles.button_row}>
        {prev}
        {next}
      </View>
    </View>
  );
};

export default PostScores;


const styles = StyleSheet.create({
  button_row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  button: {
    width: 150,
  },
  button_title: {
    fontSize: 14,
  },
});