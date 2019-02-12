import React from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';

import {
  List,
} from 'react-native-elements';

import {
  getCurrentPlayerKey,
  renderFavoritesTee
} from 'features/gameSetup/gameSetupFns';
import { GetFavoriteTeesForPlayer } from 'features/courses/graphql';



class AddCourseFavorites extends React.Component {

  render() {

    const pkey = getCurrentPlayerKey();
    console.log('pkey', pkey);

    return (
      <View style={styles.container}>
        <GetFavoriteTeesForPlayer pkey={pkey}>
          {({loading, tees}) => {
            if( loading ) return (<ActivityIndicator />);
            console.log('tees', tees);
            return (
              <List containerStyle={styles.listContainer}>
                <FlatList
                  data={tees}
                  renderItem={renderFavoritesTee}
                  keyExtractor={item => item._key}
                  keyboardShouldPersistTaps={'handled'}
                />
              </List>
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
