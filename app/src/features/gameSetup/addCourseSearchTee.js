import { useQuery } from '@apollo/client';
import { useFocusEffect } from '@react-navigation/native';
import { getRatings } from 'common/utils/game';
import { GET_FAVORITE_TEES_FOR_PLAYER_QUERY } from 'features/courses/graphql';
import { GameContext } from 'features/game/gameContext';
import Tee from 'features/gameSetup/Tee';
import { find, orderBy } from 'lodash';
import React, { useCallback, useContext, useRef } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Card, Icon, ListItem } from 'react-native-elements';

const AddCourseSearchTee = (props) => {
  const { course, setCourse } = props;
  const { game, currentPlayerKey } = useContext(GameContext);
  const searchInputRef = useRef(null);

  const _renderCourseTee = ({ item }) => {
    const { rating, slope } = getRatings(game.scope.holes, item);
    return (
      <Tee
        item={item}
        title={item.name}
        subtitle={`${item.gender} - ${rating}/${slope}`}
      />
    );
  };

  const _removeCourse = () => {
    setCourse(null);
  };

  useFocusEffect(
    useCallback(() => {
      if (searchInputRef && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, []),
  );

  const { loading, error, data } = useQuery(GET_FAVORITE_TEES_FOR_PLAYER_QUERY, {
    variables: {
      pkey: currentPlayerKey,
      gametime: game.start,
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

  console.log('faves data', data);
  const faveTees =
    data && data.getFavoriteTeesForPlayer ? data.getFavoriteTeesForPlayer : [];

  let tees = course.tees.map((tee) => {
    const { rating } = getRatings(game.scope.holes, tee);
    return {
      ...tee,
      order: rating,
      fave: {
        faved: find(faveTees, { _key: tee._key }) ? true : false,
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

  const cardHeader = (
    <ListItem>
      <ListItem.Content>
        <ListItem.Title>{course.name}</ListItem.Title>
        <ListItem.Subtitle>{`${course.city}, ${course.state}`}</ListItem.Subtitle>
      </ListItem.Content>
      <Icon
        name="remove-circle"
        color="red"
        onPress={() => {
          _removeCourse();
        }}
      />
    </ListItem>
  );

  const cardList = (
    <View style={styles.listContainer}>
      <FlatList
        data={tees}
        renderItem={_renderCourseTee}
        keyExtractor={(item) => item._key}
        keyboardShouldPersistTaps={'handled'}
      />
    </View>
  );

  return (
    <Card>
      {cardHeader}
      {cardList}
    </Card>
  );
};

export default AddCourseSearchTee;

const styles = StyleSheet.create({
  cardTitle: {
    flexDirection: 'row',
    flex: 3,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  citystate: {
    fontSize: 12,
    color: '#555',
  },
  listContainer: {
    marginTop: 0,
    marginBottom: 50,
  },
});
