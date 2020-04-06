import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';



const HandicapBadge = props => {

  const { game_handicap, course_handicap, handicap_index } = props;

  let course_game = 'CH';
  let course_game_handicap = course_handicap;
  if( game_handicap ) {
    course_game = 'GH';
    course_game_handicap = game_handicap;
  }

  const format = (v, places) => {
    if( !v ) return '-';
    return v.toFixed(places)
  };

  return (
    <View style={styles.row}>
      <View style={styles.hdcp}>
        <Text style={styles.txt}>HI</Text>
        <Text style={styles.txt}>{format(handicap_index, 1) || '-'}</Text>
      </View>
      <View style={styles.hdcp}>
        <Text style={styles.txt}>{course_game}</Text>
        <Text style={styles.txt}>{format(course_game_handicap, 0) || '-'}</Text>
      </View>
    </View>
  );

};

export default HandicapBadge;


const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flex: 2,
  },
  hdcp: {
    flex: 2,
    alignItems: 'center',
  },
  txt: {
    fontSize: 11,
  },
});
