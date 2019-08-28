import React from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View
} from 'react-native';

import {
  GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY,
  GetFavoritePlayersForPlayer
} from 'features/players/graphql';

import Player from 'features/gameSetup/Player';



class AddPlayerFavorites extends React.Component {

  constructor(props) {
    super(props);
    //console.log('addPlayerFavorites props', props);
    this._renderFavoritesPlayer = this._renderFavoritesPlayer.bind(this);
  }

  _renderFavoritesPlayer({item}) {
    const handicap = (item && item.handicap && item.handicap.display) ?
    item.handicap.display : 'no handicap';
    const club = (item && item.clubs && item.clubs[0]) ?
    ` - ${item.clubs[0].name}` : '';

    return (
      <Player
        gkey={this.props.screenProps.gkey}
        item={item}
        title={item.name}
        subtitle={`${handicap}${club}`}
      />
    );
  }


  render() {

    const pkey = this.props.screenProps.currentPlayerKey;

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
                }],
                awaitRefetchQueries: true
              }
            }));
            return (
              <View style={styles.listContainer}>
                <FlatList
                  data={newPlayers}
                  renderItem={this._renderFavoritesPlayer}
                  keyExtractor={item => item._key}
                  keyboardShouldPersistTaps={'handled'}
                />
              </View>
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
