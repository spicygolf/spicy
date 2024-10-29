import { useNavigation } from '@react-navigation/native';
import { getHoles } from 'common/utils/game';
import { GameContext } from 'features/game/gameContext';
import { orderBy } from 'lodash';
import React, { useContext } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Button, Card } from 'react-native-elements';

const GameSummary = (props) => {
  const { game, scores } = useContext(GameContext);
  const navigation = useNavigation();

  //const teamGame = getGamespecKVs(game, 'teams').includes(true);
  const totalHoles = getHoles(game).length;
  const sorted_players = orderBy(scores.players, ['gross'], ['asc']);

  const format = (v) => {
    if (v > 0) {
      return `+${v}`;
    }
    return v;
  };

  const renderPlayer = ({ item }) => {
    let thru = '';
    if (item.holesScored < totalHoles) {
      thru = `thru ${item.holesScored}`;
    }
    return (
      <View style={styles.row}>
        <View style={styles.player}>
          <Text>{item.name}</Text>
        </View>
        <View style={[styles.thru, styles.number]}>
          <Text style={styles.thruTxt}>{thru}</Text>
        </View>
        <View style={[styles.gross, styles.number]}>
          <Text>{item.gross}</Text>
        </View>
        <View style={[styles.grossToPar, styles.number]}>
          <Text>{format(item.grossToPar)}</Text>
        </View>
        <View style={[styles.points, styles.number]}>
          <Text>{format(item.netPoints)}</Text>
        </View>
      </View>
    );
  };

  const Header = () => (
    <View style={styles.row}>
      <View style={styles.player}>
        <Text style={styles.headerTxt}>Player</Text>
      </View>
      <View style={styles.thru}>
        <Text style={styles.headerTxt} />
      </View>
      <View style={styles.gross}>
        <Text style={styles.headerTxt}>Gross</Text>
      </View>
      <View style={styles.grossToPar}>
        <Text style={styles.headerTxt}>To Par</Text>
      </View>
      <View style={styles.points}>
        <Text style={styles.headerTxt}>Points</Text>
      </View>
    </View>
  );

  return (
    <Card>
      <View>
        <Header />
        <FlatList
          data={sorted_players}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.pkey}
        />
        <Button
          title="Review and post to handicap service"
          buttonStyle={styles.post_button}
          titleStyle={styles.post_button_title}
          type="solid"
          onPress={() => {
            navigation.navigate('PostScores');
          }}
        />
      </View>
    </Card>
  );
};

export default GameSummary;

const styles = StyleSheet.create({
  gross: {
    alignItems: 'center',
    flex: 1,
  },
  grossToPar: {
    alignItems: 'center',
    flex: 1,
  },
  headerTxt: {
    color: '#666',
    fontSize: 12,
    paddingBottom: 5,
  },
  number: {
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  player: {
    flex: 3,
    justifyContent: 'flex-start',
  },
  points: {
    alignItems: 'center',
    flex: 1,
  },
  post_button: {
    marginTop: 25,
  },
  post_button_title: {
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  thru: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  thruTxt: {
    fontSize: 11,
  },
});
