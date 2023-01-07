import { useNavigation } from '@react-navigation/native';
import { acronym } from 'common/utils/text';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-elements';

const TeeSelector = (props) => {
  const navigation = useNavigation();

  const { game, tee, rkey, player, readonly, testID } = props;

  const course = tee && tee.course && tee.name ? ' - ' + acronym(tee.course.name) : '';
  let buttonName = tee && tee.name ? `${tee.name}${course}` : 'Select Course/Tee';
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
        oldTee: tee,
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
