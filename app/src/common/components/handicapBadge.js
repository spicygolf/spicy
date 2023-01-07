import { formatCourseHandicap } from 'common/utils/handicap';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const HandicapBadge = (props) => {
  const { game_handicap, course_handicap, handicap_index } = props;

  let course_game = 'CH';
  let course_game_handicap = course_handicap;
  if (game_handicap) {
    course_game = 'GH';
    course_game_handicap = game_handicap;
  }
  //console.log('course_handicap', course_handicap);
  //console.log('course_game_handicap', course_game_handicap);

  return (
    <View style={styles.row}>
      <View style={styles.hdcp}>
        <Text style={styles.txt}>HI</Text>
        <Text style={styles.txt}>
          {handicap_index != null ? formatCourseHandicap(handicap_index) : '-'}
        </Text>
      </View>
      <View style={styles.hdcp}>
        <Text style={styles.txt}>{course_game}</Text>
        <Text style={styles.txt}>
          {course_game_handicap != null
            ? formatCourseHandicap(course_game_handicap)
            : '-'}
        </Text>
      </View>
    </View>
  );
};

export default HandicapBadge;

const styles = StyleSheet.create({
  hdcp: {
    alignItems: 'center',
    flex: 2,
  },
  row: {
    flexDirection: 'row',
    flex: 2,
  },
  txt: {
    fontSize: 11,
  },
});
