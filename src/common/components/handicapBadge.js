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

  return (
    <View style={styles.row}>
      <View style={styles.hdcp}>
        <Text>HI</Text>
        <Text>{handicap_index || '-'}</Text>
      </View>
      <View style={styles.hdcp}>
        <Text>{course_game}</Text>
        <Text>{course_game_handicap || '-'}</Text>
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
});
