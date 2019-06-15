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

import { find, remove } from 'lodash';

import {
  GetPlayersForGame,
  GET_PLAYERS_FOR_GAME_QUERY
} from 'features/players/graphql';

import { blue } from 'common/colors';

import { navigate } from 'common/components/navigationService';
import { RemoveLinkMutation } from 'common/graphql/unlink';



class Players extends React.Component {

  constructor(props) {
    super(props);
    this._itemPressed = this._itemPressed.bind(this);
    this._shouldShowButton = this._shouldShowButton.bind(this);
    this._renderItem = this._renderItem.bind(this);
  }

  _itemPressed(tee) {
    navigate('player_item', {tee: tee});
  }

  _shouldShowButton(players) {
    console.log('shouldShowButton players', players);
    // TODO: implement me
    return true;
  }

  _renderItem({item}) {
    if( item && item.name ) {
      const { gkey } = this.props;
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
                rightIcon={{name: 'remove-circle', color: 'red'}}
                onPress={() => this._itemPressed(item)}
                onPressRightIcon={async () => {
                  const {data, errors} = await removeLinkMutation({
                    variables: {
                      from: {type: 'player', value: item._key},
                      to: {type: 'game', value: gkey}
                    },
                    refetchQueries: [{
                      query: GET_PLAYERS_FOR_GAME_QUERY,
                      variables: {
                        gkey: gkey
                      }
                    }],
                    ignoreResults: true
                  });
                  if( errors ) {
                    console.log('error removing player from game', errors);
                  }
                }}
              />
            );
          }}
        </RemoveLinkMutation>
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
        onPress={() => navigate('add_player')}
        testID='add_player_button'
      />
    );
    const noAddButton = (<Icon name='add-circle' size={40} color='#fff'/>);

    return (
      <GetPlayersForGame gkey={gkey}>
        {({ loading, players }) => {
          if( loading ) return (<ActivityIndicator />);
          const showButton = this._shouldShowButton(players);
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

export default Players;


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
