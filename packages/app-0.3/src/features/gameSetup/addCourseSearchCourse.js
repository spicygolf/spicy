import GhinSearchCourse from "common/components/ghin/course/search";
import { AddCourseContext } from "features/gameSetup/addCourseContext";
import AddCourseSearchTee from "features/gameSetup/addCourseSearchTee";
import { useContext, useState } from "react";
import { StyleSheet, View } from "react-native";

const AddCourseSearchCourse = (_props) => {
  const { course, setCourse } = useContext(AddCourseContext);
  const defaultCourseSearch = {
    name: "",
    country: "",
    state: "",
  };
  const [courseSearch, setCourseSearch] = useState(defaultCourseSearch);

  if (course) {
    return <AddCourseSearchTee />;
  }

  // tees or course not set yet, so show search
  return (
    <View style={styles.container}>
      <GhinSearchCourse
        search={courseSearch}
        setSearch={setCourseSearch}
        course={course}
        setCourse={setCourse}
      />
    </View>
  );
};

export default AddCourseSearchCourse;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
  },
  title: {
    color: "#555",
    fontSize: 16,
    fontWeight: "bold",
  },
});
