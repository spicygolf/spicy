'use strict';

import React from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';

import {
  Card,
  Icon,
  ListItem
} from 'react-native-elements';

import { withApollo } from 'react-apollo';
import { withNavigation } from 'react-navigation';

import {
  GetPlayersForGame,
  GET_PLAYERS_FOR_GAME_QUERY
} from 'features/players/graphql';
import { RemoveLinkMutation } from 'common/graphql/unlink';
import { FindRound } from 'features/rounds/graphql';

import { blue } from 'common/colors';



class Players extends React.Component {

  constructor(props) {
    super(props);
    this._itemPressed = this._itemPressed.bind(this);
    this._shouldShowAddButton = this._shouldShowAddButton.bind(this);
    this._removePlayerFromGame = this._removePlayerFromGame.bind(this);
    this._renderItem = this._renderItem.bind(this);
  }

  _itemPressed(player) {
    console.log('pressed player', player);

    // TODO: maybe implement me?
    // I could see this being used for choosing a round of multiple that the
    // player may have going that current day.
    //
    //navigate('player_item', {player: player});
  }

  _shouldShowAddButton(players) {
    let ret = true;
    if( this.props.gamespec.max_players < 1 ) return true;
    try {
      const player_count = players.length;
      ret = (player_count < this.props.gamespec.max_players);
    } catch(e) {
      console.log('error in shouldShowButton', e);
    }
    return ret;
  }

  async _removePlayerFromGame({ removeLinkMutation, pkey, rkey }) {

    const { gkey } = this.props;

    // remove player2game link
    const { errors: p2gErrors } = await removeLinkMutation({
      variables: {
        from: {type: 'player', value: pkey},
        to: {type: 'game', value: gkey}
      },
      refetchQueries: [{
        query: GET_PLAYERS_FOR_GAME_QUERY,
        variables: {
          gkey: gkey
        }
      }],
      awaitRefetchQueries: true,
      ignoreResults: true
    });
    if( p2gErrors ) {
      console.log('error removing player from game', p2gErrors);
    }

    // remove round2game link
    const { errors: r2gErrors } = await removeLinkMutation({
      variables: {
        from: {type: 'round', value: rkey},
        to: {type: 'game', value: gkey}
      },
      ignoreResults: true
    });
    if( r2gErrors ) {
      console.log('error unlinking round from game', r2gErrors);
    }

  }

  _renderItem({item}) {
    if( item && item.name ) {
      return (
        <FindRound
          gkey={this.props.gkey}
          pkey={item._key}
        >
          {({loading, findRound}) => {
            if( loading ) return null;
            const rkey = findRound._key;
            return (
              <RemoveLinkMutation>
                {({removeLinkMutation}) => {
                  const handicap = (item && item.handicap && item.handicap.display) ?
                    item.handicap.display : 'no handicap';
                  return (
                    <ListItem
                      key={item._key}
                      title={item.name || ''}
                      subtitle={handicap}
                      onPress={() => this._itemPressed(item)}
                      rightIcon={
                        <Icon
                          name='remove-circle'
                          color='red'
                          onPress={() => this._removePlayerFromGame({
                            removeLinkMutation: removeLinkMutation,
                            pkey: item._key,
                            rkey: rkey
                          })}
                        />
                      }
                    />
                  );
                }}
              </RemoveLinkMutation>
            );
          }}
        </FindRound>
      );
    } else {
      return null;
    }
  }

  render() {

    const { gkey } = this.props;

    const addButton = (
      <Icon
        name='add-circle'
        color={blue}
        size={40}
        title='Add Player'
        onPress={() => this.props.navigation.navigate('AddPlayer')}
        testID='add_player_button'
      />
    );
    const noAddButton = (<Icon name='add-circle' size={40} color='#fff'/>);

    return (
      <GetPlayersForGame gkey={gkey}>
        {({ loading, players }) => {
          if( loading ) return (<ActivityIndicator />);
          const showButton = this._shouldShowAddButton(players);
          return (
            <Card>
              <View style={styles.cardTitle}>
                { noAddButton }
                <Text style={styles.title}>Players</Text>
                { showButton ? addButton : noAddButton }
              </View>
              <View style={styles.listContainer}>
                <FlatList
                  data={players}
                  renderItem={this._renderItem}
                  keyExtractor={item => item._key}
                />
              </View>
            </Card>
          );
        }}
      </GetPlayersForGame>
    );
  }
}

export default withNavigation(withApollo(Players));


const styles = StyleSheet.create({
  cardTitle: {
    flexDirection: 'row',
    flex: 3,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555'
  },
  listContainer: {
    marginTop: 0,
    marginBottom: 10
  },
});
