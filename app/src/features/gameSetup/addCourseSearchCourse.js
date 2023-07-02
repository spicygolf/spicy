import GhinSearchCourse from 'common/components/ghin/course/search';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import AddCourseSearchTee from './addCourseSearchTee';

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
