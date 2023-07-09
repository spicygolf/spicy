import { getRatings } from 'common/utils/game';
import { GET_FAVORITE_TEES_FOR_PLAYER_QUERY } from 'features/courses/graphql';
import { GameContext } from 'features/game/gameContext';
import Tee from 'features/gameSetup/Tee';
import { find, orderBy } from 'lodash';
import React, { useContext } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Icon, ListItem } from 'react-native-elements';

import { useGetCourseQuery } from '../courses/useGetCourseQuery';

const AddCourseSearchTee = (props) => {
  const { course, setCourse } = props;
  const { game, currentPlayerKey } = useContext(GameContext);
  const course_id = parseInt(course.course_id, 10) || 0;

  const _renderCourseTee = ({ item }) => {
    const { total_par, total_yardage } = item;
    const par = total_par ? ` - par ${total_par}` : '';
    const distance = total_yardage ? ` - ${total_yardage} yards` : '';
    const { rating, slope } = getRatings(game.scope.holes, item);
    return (
      <Tee
        item={item}
        title={item.tee_name}
        subtitle={`${item.gender} - ${rating}/${slope}${par}${distance}`}
      />
    );
  };

  const _removeCourse = () => {
    setCourse(null);
  };

  // const { loading, error, data } = useQuery(GET_FAVORITE_TEES_FOR_PLAYER_QUERY, {
  //   variables: {
  //     pkey: currentPlayerKey,
  //     gametime: game.start,
  //   },
  // });

  // if (loading) {
  //   return <ActivityIndicator />;
  // }
  // if (error) {
  //   console.log(error);
  //   // TODO: error component
  //   return <Text>Error</Text>;
  // }

  // console.log('faves data', data);
  // const faveTees = []
  //   data?.getFavoriteTeesForPlayer ? data.getFavoriteTeesForPlayer : [];
  const faveTees = [];

  const { loading, error, data } = useGetCourseQuery({
    variables: {
      q: {
        source: 'ghin',
        course_id,
      },
    },
  });

  if (loading) {
    return <ActivityIndicator />;
  }
  if (error) {
    console.log(error);
    // TODO: error component
    return <Text>Error</Text>;
  }

  let tees = data?.getCourse?.tees?.map((tee) => {
    const { rating } = getRatings(game.scope.holes, tee);
    return {
      ...tee,
      course_id,
      order: rating,
      fave: {
        faved: find(faveTees, { _key: tee.tee_id }) ? true : false,
        from: { type: 'player', value: currentPlayerKey },
        to: { type: 'tee', value: tee._key },
        refetchQueries: [
          {
            query: GET_FAVORITE_TEES_FOR_PLAYER_QUERY,
            variables: {
              pkey: currentPlayerKey,
              gametime: game.start,
            },
          },
        ],
      },
    };
  });
  tees = orderBy(tees, ['gender', 'order'], ['desc', 'desc']);

  return (
    <View style={styles.container}>
      <ListItem style={styles.course_row}>
        <ListItem.Content>
          <ListItem.Title>{course.display_name}</ListItem.Title>
          <ListItem.Subtitle style={styles.citystate}>
            {course.city_state}
          </ListItem.Subtitle>
        </ListItem.Content>
        <Icon
          name="remove-circle"
          color="red"
          onPress={() => {
            _removeCourse();
          }}
        />
      </ListItem>
      <View style={styles.listContainer}>
        <FlatList
          data={tees}
          renderItem={_renderCourseTee}
          keyExtractor={(item) => item.tee_id.toString()}
          keyboardShouldPersistTaps={'handled'}
        />
      </View>
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
