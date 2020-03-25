import React, { useContext, useRef, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import {
  Card,
  ListItem,
  Icon
} from 'react-native-elements';
import { useQuery } from '@apollo/react-hooks';
import { useFocusEffect } from '@react-navigation/native';
import { find, orderBy } from 'lodash';

import { SEARCH_COURSE_QUERY } from 'features/courses/graphql';
import { GET_FAVORITE_TEES_FOR_PLAYER_QUERY } from 'features/courses/graphql';
import Tee from 'features/gameSetup/Tee';
import { GameContext } from 'features/game/gameContext';
import { getRatings } from 'common/utils/game';



const ListHeader = ({title}) => (
  <View>
    <Text style={styles.header}>{title}</Text>
  </View>
);



const AddCourseSearch = props => {

  const { game, currentPlayerKey } = useContext(GameContext);
  //console.log('currentPlayerKey', currentPlayerKey);

  const [ q, setQ ] = useState('');
  const [ course, setCourse ] = useState(null);

  const searchInputRef = useRef(null);

  const _coursePressed = course => {
    Keyboard.dismiss();
    setCourse(course);
  }

  const _removeCourse = () => {
    setCourse(null);
  }

  const _renderCourse = ({item}) => {
    return (
      <ListItem
        title={item.name || ''}
        subtitle={`${item.city}, ${item.state}`}
        onPress={() => _coursePressed(item)}
      />
    );
  }

  const _renderCourseTee = ({item}) => {
    const { rating, slope } = getRatings(game.holes, item);
    return (
      <Tee
        item={item}
        title={item.name}
        subtitle={`${item.gender} - ${rating}/${slope}`}
      />
    );
  }

  useFocusEffect(
    React.useCallback(() => {
      if( searchInputRef && searchInputRef.current ) {
        searchInputRef.current.focus();
      }
    })
  );

  if( !course ) {

    const { loading, error, data } = useQuery(SEARCH_COURSE_QUERY, {
      variables: {
        q: q,
      }
    });
    if( loading ) return (<ActivityIndicator />);
    if( error ) {
      console.log(error);
      return (<Text>Error</Text>);
    }

    const header = (
      data &&
      data.searchCourse &&
      data.searchCourse.length) ?
    (<ListHeader title='Courses' />) : null;

    return (
      <View style={styles.container}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchTextInput}
          placeholder='search courses...'
          autoCapitalize='none'
          autoFocus={true}
          onChangeText={text => setQ(text)}
          value={q}
        />
        <FlatList
          data={data.searchCourse}
          renderItem={_renderCourse}
          ListHeaderComponent={header}
          keyExtractor={item => item._key}
          keyboardShouldPersistTaps={'handled'}
        />
      </View>
    );

  } else {

    const { loading, error, data } = useQuery(GET_FAVORITE_TEES_FOR_PLAYER_QUERY, {
      variables: {
        pkey: currentPlayerKey,
      }
    });

    if( loading ) return (<ActivityIndicator />);
    if( error ) {
      console.log(error);
      return (<Text>Error</Text>);
    }

    console.log('faves data', data);
    const faveTees = (data && data.getFavoriteTeesForPlayer ?
      data.getFavoriteTeesForPlayer : []);

    let tees = course.tees.map(tee => {
      const { rating } = getRatings(game.holes, tee);
      return ({
        ...tee,
        order: rating,
        fave: {
          faved: (find(faveTees, {_key: tee._key}) ? true : false),
          from: {type: 'player', value: currentPlayerKey},
          to:   {type: 'tee', value: tee._key},
          refetchQueries: [{
            query: GET_FAVORITE_TEES_FOR_PLAYER_QUERY,
            variables: {
              pkey: currentPlayerKey
            }
          }]
        }
      });
    });
    tees = orderBy(
      tees,
      ['gender', 'order'],
      ['desc',   'desc' ]
    );

    const cardHeader = (
      <ListItem
        title={course.name}
        subtitle={`${course.city}, ${course.state}`}
        rightIcon={
          <Icon
            name='remove-circle'
            color='red'
            onPress={() => {
              _removeCourse();
            }}
          />
        }
      />
    );

    const cardList = (
      <View style={styles.listContainer}>
        <FlatList
          data={tees}
          renderItem={_renderCourseTee}
          keyExtractor={item => item._key}
          keyboardShouldPersistTaps={'handled'}
        />
      </View>
    );

    return (
      <Card>
        { cardHeader }
        { cardList }
      </Card>
    );

  }

};

export default AddCourseSearch;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 15
  },
  header: {
    paddingTop: 10,
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 20,
    fontWeight: 'bold'
  },
  searchTextInput: {
    fontSize: 20,
    width: '100%',
    paddingLeft: 20,
    paddingRight: 20
  },
  cardTitle: {
    flexDirection: 'row',
    flex: 3,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555'
  },
  citystate: {
    fontSize: 12,
    color: '#555'
  },
  listContainer: {
    marginTop: 0,
    marginBottom: 50
  }
});
