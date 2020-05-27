import React, { useContext } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  Card,
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { orderBy } from 'lodash';

import { getGamespecKVs } from 'common/utils/game';
import { GameContext } from 'features/game/gameContext';



const GameSummary = props => {

  const { game, scores } = useContext(GameContext);
  const navigation = useNavigation();

  const teamGame = getGamespecKVs(game, 'teams').includes(true);

  const sorted_players = orderBy(scores.players, ['gross'], ['asc']);

  const format = v => {
    if( v > 0 ) return `+${v}`;
    return v;
  };

  const renderPlayer = ({item}) => {
    return (
      <View style={styles.row}>
        <View style={styles.player}>
          <Text>{item.name}</Text>
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
          keyExtractor={item => item.pkey}
        />
        <Button
          title='Review and post to handicap service'
          buttonStyle={styles.post_button}
          titleStyle={styles.post_button_title}
          type='solid'
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
  row: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  player: {
    flex: 4,
    justifyContent: 'flex-start',
  },
  gross: {
    flex: 1,
    alignItems: 'center',
  },
  grossToPar: {
    flex: 1,
    alignItems: 'center',
  },
  points: {
    flex: 1,
    alignItems: 'center',
  },
  number: {
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  headerTxt: {
    color: '#666',
    paddingBottom: 5,
  },
  post_button: {
    marginTop: 25,
  },
  post_button_title: {
    fontSize: 15,
  },
});