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
  renderPlayer
} from 'features/gameSetup/gameSetupFns';
import {
  GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY,
  GetFavoritePlayersForPlayer
} from 'features/players/graphql';



class AddPlayerFavorites extends React.Component {

  render() {

    const pkey = getCurrentPlayerKey();

    return (
      <View style={styles.container}>
        <GetFavoritePlayersForPlayer pkey={pkey}>
          {({loading, players}) => {
            if( loading ) return (<ActivityIndicator />);
            const newPlayers = players.map(player => ({
              ...player,
              fave: {
                faved: true,
                from: {type: 'player', value: pkey},
                to:   {type: 'player', value: player._key},
                refetchQueries: [{
                  query: GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY,
                  variables: {
                    pkey: pkey
                  }
                }]
              }
            }));
            return (
              <List containerStyle={styles.listContainer}>
                <FlatList
                  data={newPlayers}
                  renderItem={renderPlayer}
                  keyExtractor={item => item._key}
                  keyboardShouldPersistTaps={'handled'}
                />
              </List>
            );
          }}
        </GetFavoritePlayersForPlayer>
      </View>
    );
  }

}

export default AddPlayerFavorites;


const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  listContainer: {
    marginTop: 0,
    marginBottom: 50
  }
});
