import { getRatings } from 'common/utils/game';
import { addFavesToTee } from 'common/utils/tees';
import { useGetCourseQuery } from 'features/courses/useGetCourseQuery';
// import { useGetFavoriteTeesForPlayerQuery } from 'features/courses/useGetFavoriteTeesForPlayerQuery';
import { GameContext } from 'features/game/gameContext';
import { AddCourseContext } from 'features/gameSetup/addCourseContext';
import TeeList from 'features/gameSetup/TeeList';
import { orderBy } from 'lodash';
import React, { useContext } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Icon, ListItem } from 'react-native-elements';

const AddCourseSearchTee = (props) => {
  const { course, setCourse } = useContext(AddCourseContext);
  const { game, currentPlayerKey } = useContext(GameContext);
  const course_id = parseInt(course.course_id, 10) || 0;

  // const faves = useGetFavoriteTeesForPlayerQuery({
  //   variables: {
  //     pkey: currentPlayerKey,
  //     gametime: game.start,
  //   },
  // });

  // if (faves.loading) {
  //   return <ActivityIndicator />;
  // }
  // if (faves.error) {
  //   console.log(error);
  //   // TODO: error component
  //   return <Text>Error</Text>;
  // }

  // const faveTees = faves.data?.getFavoriteTeesForPlayer ?? [];
  const faves = [];

  // get selected course from GHIN (the full course details with tee sets)
  const selectedCourse = useGetCourseQuery({
    variables: {
      q: {
        course_id,
      },
    },
  });

  if (selectedCourse.loading) {
    return <ActivityIndicator />;
  }
  if (selectedCourse.error) {
    console.log(selectedCourse.error);
    // TODO: error component
    return <Text>Error</Text>;
  }

  // decorate tees with faves data
  let tees = selectedCourse.data?.getCourse?.tees?.map((tee) => {
    const { rating } = getRatings(game.scope.holes, tee);
    let newTee = addFavesToTee({ tee, faves, game, currentPlayerKey });
    return {
      ...newTee,
      course_id,
      order: rating,
    };
  });
  tees = orderBy(tees, ['gender', 'order'], ['desc', 'desc']);

  return (
    <View style={styles.container}>
      <ListItem style={styles.course_row}>
        <ListItem.Content>
          <ListItem.Title>{course.course_name}</ListItem.Title>
          <ListItem.Subtitle style={styles.citystate}>
            {course.city_state}
          </ListItem.Subtitle>
        </ListItem.Content>
        <Icon name="remove-circle" color="red" onPress={() => setCourse(null)} />
      </ListItem>
      <TeeList tees={tees} showRemove={false} allowAddToRound={true} />
    </View>
  );
};

export default AddCourseSearchTee;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  citystate: {
    color: '#999',
    fontSize: 12,
  },
  listContainer: {
    flex: 1,
    margin: 0,
  },
});
