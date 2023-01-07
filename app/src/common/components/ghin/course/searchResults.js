import { GhinCourseSearchContext } from 'common/components/ghin/course/searchContext';
import { useSearchCourseQuery } from 'features/courses/useSearchCourseQuery';
import { orderBy } from 'lodash-es';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { ListItem } from 'react-native-elements';

const GhinCourseSearchResults = (props) => {
  const { search, setCourse } = useContext(GhinCourseSearchContext);
  const [page, setPage] = useState(1);
  const perPage = 25;
  const [courses, setCourses] = useState([]);

  const keyExtractor = (c) => `${c?.course_id}`;

  const sortAndCleanCourses = (old) => {
    const cleaned = old.map(c => {
      let display_name = c.facility_name;
      if (c.facility_name !== c.course_name) {
        display_name = display_name + ' - ' + c.course_name;
      }
      const city_state = `${c.city}, ${c.state}`;
      return {
        ...c,
        display_name,
        city_state,
      }
    });
    return orderBy(cleaned, ['display_name'], ['asc']);
  };

  const renderCourse = ({ item: course }) => {
    if (!course) {
      return null;
    }

    return (
      <ListItem
        containerStyle={styles.container}
        key={course.course_id}
        onPress={() => {
          setCourse(course);
        }}
      >
        <ListItem.Content style={styles.container}>
          <ListItem.Title style={styles.course_name}>{course.display_name}</ListItem.Title>
          <ListItem.Subtitle
            style={styles.course_citystate}
          >{`${course.city_state}`}</ListItem.Subtitle>
        </ListItem.Content>
      </ListItem>
    );
  };

  const { loading, error, data } = useSearchCourseQuery({
    variables: {
      q: search,
      p: {
        page,
        perPage,
      },
    },
  });

  // if search changes at all, reset everything
  useEffect(() => {
    setPage(1);
    setCourses([]);
  }, [search]);

  // when new data arrives, add it to `courses` array
  useEffect(() => {
    if (data?.searchCourse) {
      setCourses((c) => c.concat(data?.searchCourse));
    }
  }, [data]);

  if (loading) {
    return (
      <View style={styles.results_list}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error && error.message !== 'Network request failed') {
    console.log(error);
    // TODO: error component
    return <Text>Error Searching Courses: `{error.message}`</Text>;
  }

  // console.log(data?.searchCourse, courses);
  const sortedCourses = sortAndCleanCourses(courses);

  return (
    <FlatList
      data={sortedCourses}
      renderItem={renderCourse}
      keyExtractor={keyExtractor}
      onEndReachedThreshold={0.8}
      onEndReached={async () => {
        // data is as long as perPage, so we're not at end yet
        if (data.searchCourse.length === perPage) {
          setPage((p) => p + 1);
        }
      }}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.no_results}>No Results</Text>
        </View>
      }
    />
  );
};

export default GhinCourseSearchResults;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    marginHorizontal: 0,
    paddingHorizontal: 5,
  },
  emptyContainer: {
    flex: 1,
  },
  course_name: {
    // color: '#999',
    // fontSize: 11,
  },
  course_citystate: {
    color: '#999',
    fontSize: 11,
    fontWeight: 'bold',
  },
  no_results: {
    color: '#999',
    alignSelf: 'center',
    fontSize: 20,
  },
});
