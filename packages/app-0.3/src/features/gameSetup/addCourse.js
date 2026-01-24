import { AddCourseContext } from "features/gameSetup/addCourseContext";
import AddCourseTabs from "features/gameSetup/addCourseTabs";
import GameNav from "features/games/gamenav";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

const AddCourse = (props) => {
  const { route } = props;
  const { rkey, tees, player } = route.params;
  const [course, setCourse] = useState(null);

  return (
    <View style={styles.container}>
      <GameNav title="Course & Tees" showBack={true} backTo={"GameSetup"} />
      <AddCourseContext.Provider
        value={{
          course,
          setCourse,
          rkey,
          tees,
          player,
        }}
      >
        <AddCourseTabs player={player} />
      </AddCourseContext.Provider>
    </View>
  );
};

export default AddCourse;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
