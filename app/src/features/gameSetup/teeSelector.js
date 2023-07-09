import { useNavigation } from '@react-navigation/native';
import { acronym } from 'common/utils/text';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-elements';

const TeeSelector = (props) => {
  const navigation = useNavigation();

  const { game, tees, rkey, player, readonly, testID } = props;

  // TODO: here we now have `tees` instead of `tee`
  //       handle none, one (most common), and multiple `tees`
  const tee = (tees && tees[0]) || {};

  const course = tee?.course?.course_name ? ' - ' + acronym(tee.course.course_name) : '';
  let buttonName = tee && tee.tee_name ? `${tee.tee_name}${course}` : 'Select Course/Tee';
  let pressFn;

  if (readonly) {
    return (
      <View>
        <Text style={styles.title}>{buttonName}</Text>
      </View>
    );
  }

  // if we have round key, go to AddCourse.
  // If for some reason we don't go to LinkRound
  if (rkey) {
    pressFn = () =>
      navigation.navigate('AddCourse', {
        rkey: rkey,
      });
  } else {
    pressFn = () => navigation.navigate('LinkRoundList', { game, player });
    buttonName = 'Select Round';
  }

  return (
    <View>
      <Button
        title={buttonName}
        type="clear"
        buttonStyle={styles.button}
        titleStyle={styles.title}
        onPress={pressFn}
        testID={`tee_selector_${testID}`}
      />
    </View>
  );
};

export default TeeSelector;

const styles = StyleSheet.create({
  button: {
    justifyContent: 'flex-start',
    paddingBottom: 3,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 3,
  },
  title: {
    fontSize: 14,
  },
});
