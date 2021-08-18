import { GameContext } from 'features/game/gameContext';
import GameNav from 'features/games/gamenav';
import PostScore from 'features/gameSummary/postScore';
import { orderBy } from 'lodash';
import React, { useContext, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-elements';

const PostScores = (props) => {
  const { game, scores } = useContext(GameContext);
  const sorted_players = orderBy(scores.players, ['gross'], ['asc']);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  const currentPlayer = sorted_players[currentPlayerIndex];

  const prev = (
    <Button
      title="Previous"
      buttonStyle={styles.button}
      titleStyle={styles.button_title}
      disabled={currentPlayerIndex == 0}
      onPress={() => {
        let cpi = currentPlayerIndex - 1;
        if (cpi < 0) cpi = 0;
        setCurrentPlayerIndex(cpi);
      }}
    />
  );

  const next = (
    <Button
      title="Next"
      buttonStyle={styles.button}
      titleStyle={styles.button_title}
      disabled={currentPlayerIndex == sorted_players.length - 1}
      onPress={() => {
        let cpi = currentPlayerIndex + 1;
        if (cpi > sorted_players.length - 1) cpi = sorted_players.length - 1;
        setCurrentPlayerIndex(cpi);
      }}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.gameNav}>
        <GameNav title="Post Rounds" showBack={true} showScore={false} />
      </View>
      <View style={styles.postScore}>
        <PostScore player={currentPlayer} game={game} />
      </View>
      <View style={styles.buttonRow}>
        {prev}
        {next}
      </View>
    </View>
  );
};

export default PostScores;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gameNav: {
    flex: 1,
  },
  postScore: {
    flex: 9,
  },
  buttonRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  button: {
    width: 150,
  },
  button_title: {
    fontSize: 14,
  },
});
