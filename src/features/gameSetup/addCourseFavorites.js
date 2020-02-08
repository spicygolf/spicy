import React, { useContext } from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View
} from 'react-native';

import { useQuery } from 'react-apollo';

import { GET_FAVORITE_TEES_FOR_PLAYER_QUERY } from 'features/courses/graphql';

import Tee from 'features/gameSetup/Tee';
import { GameContext } from 'features/game/gameContext';
import { AddCourseContext } from 'features/gameSetup/addCourseContext';



const AddCourseFavorites = props => {

  const { game, currentPlayerKey } = useContext(GameContext);

  const _renderFavoritesTee = ({item}) => {
    return (
      <Tee
        item={item}
        title={item.course.name}
        subtitle={`${item.name} - ${item.rating.all18}/${item.slope.all18}`}
        rounds={[]}
      />
    );
  }

  const { loading, error, data } = useQuery(GET_FAVORITE_TEES_FOR_PLAYER_QUERY, {
    variables: {
      pkey: currentPlayerKey
    },
    fetchPolicy: 'cache-and-network',
  });

  if( loading ) return (<ActivityIndicator />);
  if (error) return (<Text>Error! ${error.message}</Text>);

  //console.log('client', client);
  console.log('faveTees data', data);

  const tees = (data && data.getFavoriteTeesForPlayer) ?
    data.getFavoriteTeesForPlayer : [];
  console.log('tees', tees, currentPlayerKey);

  const newTees = tees.map(tee => ({
    ...tee,
    fave: {
      faved: true,
      from: {type: 'player', value: currentPlayerKey},
      to:   {type: 'tee', value: tee._key},
      refetchQueries: [{
        query: GET_FAVORITE_TEES_FOR_PLAYER_QUERY,
        variables: {
          pkey: currentPlayerKey
        }
      }]
    }
  }));
  console.log('newTees', newTees);

  return (
    <View style={styles.container}>
      <View style={styles.listContainer}>
        <FlatList
          data={newTees}
          renderItem={_renderFavoritesTee}
          keyExtractor={item => item._key}
          keyboardShouldPersistTaps={'handled'}
        />
      </View>
    </View>
  );

};

export default AddCourseFavorites;


const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  listContainer: {
    marginTop: 0,
    marginBottom: 50
  }
});
