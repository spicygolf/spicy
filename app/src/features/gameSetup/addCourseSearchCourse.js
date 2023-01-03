import { useQuery } from '@apollo/client';
import { useFocusEffect } from '@react-navigation/native';
import { SEARCH_COURSE_QUERY } from 'features/courses/graphql';
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
  const [search, setSearch] = useState('');
  const [course, setCourse] = useState(null);

  const searchInputRef = useRef(null);

  const _coursePressed = (lCourse) => {
    Keyboard.dismiss();
    setCourse(lCourse);
  };

  const _renderCourse = ({ item }) => {
    return (
      <ListItem onPress={() => _coursePressed(item)}>
        <ListItem.Content>
          <ListItem.Title>{item.name || ''}</ListItem.Title>
          <ListItem.Subtitle>{`${item.city}, ${item.state}`}</ListItem.Subtitle>
        </ListItem.Content>
      </ListItem>
    );
  };

  useFocusEffect(
    useCallback(() => {
      if (searchInputRef && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, []),
  );

  const { loading, error, data } = useQuery(SEARCH_COURSE_QUERY, {
    variables: {
      q: search,
    },
  });
  if (loading) {
    return <ActivityIndicator />;
  }
  if (error) {
    console.log(error);
    return <Text>Error</Text>;
  }

  const header =
    data && data.searchCourse && data.searchCourse.length ? (
      <ListHeader title="Courses" />
    ) : null;

  if (!course) {
    return (
      <View style={styles.container}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchTextInput}
          placeholder="search courses..."
          autoCapitalize="none"
          onChangeText={(text) => setSearch(text)}
          value={search}
        />
        <FlatList
          data={data.searchCourse}
          renderItem={_renderCourse}
          ListHeaderComponent={header}
          keyExtractor={(item) => item._key}
          keyboardShouldPersistTaps={'handled'}
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
    marginTop: 15,
  },
  header: {
    paddingTop: 10,
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchTextInput: {
    fontSize: 20,
    color: '#000',
    width: '100%',
    paddingLeft: 20,
    paddingRight: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
});
