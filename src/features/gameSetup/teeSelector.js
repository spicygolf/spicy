import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Button } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';

import { acronym } from 'common/utils/text';



const TeeSelector = (props) => {

  const navigation = useNavigation();

  const { tee, rkey, player } = props;

  const course = (tee && tee.course && tee.name) ?
    ' - ' + acronym(tee.course.name) : '';
  let buttonName = (tee && tee.name) ? `${tee.name}${course}`
    : 'Select Course/Tee';
  let pressFn;

  // if we have round key, go to AddCourse.
  // If for some reason we don't go to LinkRound
  if( rkey ) {
    pressFn = () => navigation.navigate('AddCourse', {
      rkey: rkey,
      oldTee: tee,
    })
  } else {
    pressFn = () => navigation.navigate('LinkRound', {
      player: player,
    });
    buttonName = 'Select Round';
  }

  return (
    <View>
      <Button
        title={buttonName}
        type="clear"
        buttonStyle={styles.button}
        onPress={pressFn}
      />
    </View>
  );
};

export default TeeSelector;

const styles = StyleSheet.create({
  button: {
    justifyContent: 'flex-start',
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 0,
    paddingRight: 0,

  }
});
