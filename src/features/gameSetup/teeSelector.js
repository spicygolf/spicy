import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Button } from 'react-native-elements';
import { acronym } from 'common/utils/text';


const TeeSelector = (props) => {

  //console.log('TeeSelector props', props);
  const { tee, rkey, navigation } = props;
  const course = (tee && tee.course && tee.name) ?
    ' - ' + acronym(tee.course.name) : '';
  const teeName = (tee && tee.name) ? `${tee.name}${course}`
    : 'Select Course/Tee';

  return (
    <View>
      <Button
        title={teeName}
        type="clear"
        buttonStyle={styles.button}
        onPress={() => navigation.navigate('AddCourse', {
          tee: tee,
          rkey: rkey
        })}
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
