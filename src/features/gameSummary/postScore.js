import React, { useContext, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
} from 'react-native';
import {
  Card,
} from 'react-native-elements';
import { reduce } from 'lodash';

import {
  get_hole,
  get_round_for_player,
  get_score_value,
} from 'common/utils/rounds';
import { GameContext } from 'features/game/gameContext';
import { FlatList } from 'react-native-gesture-handler';



const PostScore = props => {

  const { player } = props;
  const { game } = useContext(GameContext);
  const round = get_round_for_player(game.rounds, player.pkey);
  const [ posting, setPosting ] = useState();

  const calcPosting = round => {
    return round.scores.map(s => {
      const gross = get_score_value('gross', s);
      const hole = get_hole(s.hole, round);
      //console.log('renderHole hole', hole);
      const coursePops = parseFloat(s.coursePops) || 0;
      const net = gross - coursePops;
      const par = parseInt(hole.par);
      const netToPar = net - par;
      //console.log('calcPosting netToPar', netToPar);
      let adjusted = gross;
      let isAdjusted = false;
      if( netToPar > 2 ) {
        // can't take more than a 'net double' on a hole
        adjusted = adjusted - ( netToPar - 2 );
        isAdjusted = true;
      }
      return {
        hole,
        gross,
        net,
        par,
        netToPar,
        adjusted,
        isAdjusted,
      };
    });
  };

  const calcAdjustedTotal = () => (
    reduce(posting, (sum, h) => (
      sum + (parseFloat(h.adjusted) || 0)
    ), 0)
  );

  const header = () => (
    <View style={styles.holeContainer}>
      <Text style={styles.hdr}>Hole</Text>
      <Text style={styles.hdr}>Handicap</Text>
      <Text style={styles.hdr}>Gross</Text>
      <Text style={styles.hdr}>Adjusted</Text>
    </View>
  );

  const footer = () => {
    const adjustedTotal = calcAdjustedTotal();
    return (
      <View style={styles.holeContainer}>
        <Text style={styles.hdr}>Totals</Text>
        <Text style={styles.hdr}></Text>
        <View style={styles.hdr}>
          <Text style={styles.gross}>{player.gross}</Text>
        </View>
        <View style={styles.hdr}>
          <Text style={styles.gross}>{adjustedTotal}</Text>
        </View>
      </View>
    );
  };

  const renderHole = ({item, index}) => {
    return (
      <View style={styles.holeContainer}>
        <View style={styles.hole}>
          <Text style={styles.holeTxt}>{item.hole.hole}</Text>
        </View>
        <View style={styles.hdcp}>
          <Text style={styles.hdcpTxt}>{item.hole.handicap}</Text>
        </View>
        <View style={styles.gross}>
          <Text style={styles.grossTxt}>{item.gross}</Text>
        </View>
        <View style={styles.adjusted}>
          <TextInput
            style={[
              styles.adjustedTxt,
              item.isAdjusted ? styles.isAdjusted : null,
            ]}
            onChangeText={text => {
              let newPosting = [...posting];
              const newHole = {
                ...newPosting[index],
                adjusted: text
              };
              newPosting.splice(index, 1, newHole);
              setPosting(newPosting);
            }}
            keyboardType='decimal-pad'
            value={item.adjusted.toString()}
          />
        </View>
      </View>
    );
  };

  useEffect(
    () => {
      const newPosting = calcPosting(round);
      setPosting(newPosting);
    }, [round]
  );

  return (
    <Card containerStyle={styles.container}>
      <Text style={styles.playerName}>{player.name}</Text>
      <Text style={styles.courseHandicap}>
        Course Handicap: {player.courseHandicap}
      </Text>
      <View style={styles.flatListView}>
      { header() }
      <FlatList
        contentContainerStyle={styles.flatList}
        data={posting}
        renderItem={renderHole}
        keyExtractor={item => item.hole.hole}
      />
      { footer() }
      </View>
    </Card>
  );
};

export default PostScore;


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatListView: {
    height: '95%'
  },
  flatList: {
    paddingBottom: 10,
  },
  playerName: {
    fontWeight: 'bold',
  },
  courseHandicap: {
    fontSize: 11,
  },
  holeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hdr: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 5,
    color: '#666',
  },
  hole: {
    flex: 1,
    textAlign: 'center',
    justifyContent: 'center',
  },
  holeTxt: {
    alignSelf: 'center',
    color: '#666',
  },
  gross: {
    flex: 1,
    textAlign: 'center',
    justifyContent: 'center',
  },
  grossTxt: {
    alignSelf: 'center',
  },
  hdcp: {
    flex: 1,
    textAlign: 'center',
    justifyContent: 'center',
  },
  hdcpTxt: {
    alignSelf: 'center',
  },
  adjusted: {
    flex: 1,
    justifyContent: 'center',
  },
  adjustedTxt: {
    height: 22,
    color: '#000',
    borderColor: '#ddd',
    borderWidth: 1,
    paddingHorizontal: 15,
    marginVertical: 2,
    textAlign: 'right',
    alignSelf: 'center',
  },
  isAdjusted: {
    borderColor: '#111'
  },
});
