'use strict';

import React from 'react';

import {
  ActivityIndicator,
  FlatList,
  Text,
  View
} from 'react-native';

import { Query, withApollo } from 'react-apollo';
import gql from 'graphql-tag';

import { List, ListItem } from 'react-native-elements';

import GameNav from 'features/games/gamenav';

import {
  GAMESPECS_FOR_PLAYER_QUERY
} from 'features/games/graphql';


class NewGame extends React.Component {

  constructor(props) {
    super(props);
    this._renderItem = this._renderItem.bind(this);
    this._itemPressed = this._itemPressed.bind(this);
  }

  _itemPressed(item) {
    this.props.navigation.navigate('GameSetup', {
      game: null,
      gamespec: item
    });
  }

  _renderItem({item}) {
    return (
      <ListItem
        roundAvatar
        title={item.name || ''}
        subtitle={item.type || ''}
        onPress={() => this._itemPressed(item)}
      />
    );
  }


  render() {
    const currentPlayerKey = this.props.navigation.getParam('currentPlayerKey');

    return (
      <Query
        query={GAMESPECS_FOR_PLAYER_QUERY}
        variables={{pkey: currentPlayerKey}}
        fetchPolicy='cache-and-network'
      >
        {({ data, loading, error}) => {
          if( loading ) return (<ActivityIndicator />);

          // TODO: error component instead of below...
          if( error || !data.gameSpecsForPlayer ) {
            console.log(error);
            return (<Text>Error</Text>);
          }

          //console.log('data', data);
          return (
            <View>
              <GameNav
                title='New Game'
                showBack={true}
                showScore={false}
                navigation={this.props.navigation}
              />
              <List>
                <FlatList
                  data={data.gameSpecsForPlayer}
                  renderItem={this._renderItem}
                  keyExtractor={item => item._key}
                />
              </List>
            </View>
          );
        }}
      </Query>
    );
  }
}

export default withApollo(NewGame);
