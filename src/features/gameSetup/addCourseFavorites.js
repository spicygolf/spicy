import React from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View
} from 'react-native';

import {
  getCurrentPlayerKey,
  renderFavoritesTee
} from 'features/gameSetup/gameSetupFns';
import {
  GET_FAVORITE_TEES_FOR_PLAYER_QUERY,
  GetFavoriteTeesForPlayer
} from 'features/courses/graphql';



class AddCourseFavorites extends React.Component {

  render() {

    const pkey = getCurrentPlayerKey();

    return (
      <View style={styles.container}>
        <GetFavoriteTeesForPlayer pkey={pkey}>
          {({loading, tees}) => {
            if( loading ) return (<ActivityIndicator />);
            const newTees = tees.map(tee => ({
              ...tee,
              fave: {
                faved: true,
                from: {type: 'player', value: pkey},
                to:   {type: 'tee', value: tee._key},
                refetchQueries: [{
                  query: GET_FAVORITE_TEES_FOR_PLAYER_QUERY,
                  variables: {
                    pkey: pkey
                  }
                }]
              }
            }));
            return (
              <View style={styles.listContainer}>
                <FlatList
                  data={newTees}
                  renderItem={renderFavoritesTee}
                  keyExtractor={item => item._key}
                  keyboardShouldPersistTaps={'handled'}
                />
              </View>
            );
          }}
        </GetFavoriteTeesForPlayer>
      </View>
    );
  }

}

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
