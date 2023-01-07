import { useFocusEffect } from '@react-navigation/native';
import GhinSearchCourse from 'common/components/ghin/course/search';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ListItem } from 'react-native-elements';

import AddCourseSearchTee from './addCourseSearchTee';

const ListHeader = ({ title }) => (
  <View>
    <Text style={styles.header}>{title}</Text>
  </View>
);

const AddCourseSearchCourse = (props) => {
  const defaultCourseSearch = {
    source: 'ghin',
    country: '',
    state: '',
    course_name: '',
  };

  const [courseSearch, setCourseSearch] = useState(defaultCourseSearch);
  const [course, setCourse] = useState(null);
  const [tee, setTee] = useState(null);

  // const _coursePressed = (lCourse) => {
  //   Keyboard.dismiss();
  //   setCourse(lCourse);
  // };

  // const _renderCourse = ({ item }) => {
  //   return (
  //     <ListItem onPress={() => _coursePressed(item)}>
  //       <ListItem.Content>
  //         <ListItem.Title>{item.name || ''}</ListItem.Title>
  //         <ListItem.Subtitle>{`${item.city}, ${item.state}`}</ListItem.Subtitle>
  //       </ListItem.Content>
  //     </ListItem>
  //   );
  // };

  // useFocusEffect(
  //   useCallback(() => {
  //     if (searchInputRef && searchInputRef.current) {
  //       searchInputRef.current.focus();
  //     }
  //   }, []),
  // );

  // const header =
  //   data && data.searchCourse && data.searchCourse.length ? (
  //     <ListHeader title="Courses" />
  //   ) : null;

  if (!course) {
    return (
      <View style={styles.container}>
        <GhinSearchCourse
          search={courseSearch}
          setSearch={setCourseSearch}
          course={course}
          setCourse={setCourse}
          tee={tee}
          setTee={setTee}
        />
      </View>
    );
  } else {
    return <AddCourseSearchTee course={course} setCourse={setCourse} />;
  }
};

export default AddCourseSearchCourse;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
  },
  title: {
    color: '#555',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
