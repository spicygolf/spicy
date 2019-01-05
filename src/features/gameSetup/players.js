'use strict';

import React from 'react';

import {
  ActivityIndicator,
  AsyncStorage,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';

import {
  Button,
  Card,
  Icon,
  List,
  ListItem
} from 'react-native-elements';

import { remove } from 'lodash';

import { Query } from 'react-apollo';

import {
  GET_PLAYER_QUERY
} from 'features/players/graphql';



class Players extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      currentPlayerKey: null
    };
    this._addPressed = this._addPressed.bind(this);
    this._itemPressed = this._itemPressed.bind(this);
    this._removePressed = this._removePressed.bind(this);
    this._renderItem = this._renderItem.bind(this);
  }

  _addPressed() {
    this.props.navigation.navigate('add_player');
  }

  _itemPressed(player) {
    this.props.navigation.navigate('player_item', {player: player});
  }

  _removePressed(item) {
    this.props.removeFn(item);
  }

  _renderItem({item}) {
    const handicap = (item && item.handicap && item.handicap.display) ?
      item.handicap.display : 'no handicap';
    return (
      <ListItem
        title={item.name || ''}
        subtitle={handicap}
        rightIcon={{name: 'remove-circle', color: 'red'}}
        onPress={() => this._itemPressed(item)}
        onPressRightIcon={() => this._removePressed(item)}
      />
    );
  }

  async componentDidMount() {
    const cpkey = await AsyncStorage.getItem('currentPlayer');
    this.setState({currentPlayerKey: cpkey});
  }

  render() {

    if( !this.state.currentPlayerKey ) return (<ActivityIndicator />);

    const addButton = ( this.props.showButton ) ?
      (
        <Button
          title='Add Player'
          onPress={() => this._addPressed()}
        />
      ) : null;

    return (
      <Query
        query={GET_PLAYER_QUERY}
        variables={{ player: this.state.currentPlayerKey }}
      >
        {({ loading, error, data }) => {
          if( loading ) return (<ActivityIndicator />);
          if( error ) {
            console.log(error);
            return (<Text>Error</Text>);
          }

          let players = this.props.players;

          // if players is blank, i.e. new game getting set up, then add the
          // current logged in player, unless they've already been removed once
          if( players.length == 0 &&
              this.props.addCurrentPlayer &&
              data &&
              data.getPlayer ) {
            players = [ data.getPlayer ];
          }

          return (
            <Card title='Players'>
              <List containerStyle={styles.listContainer}>
                <FlatList
                  data={players}
                  renderItem={this._renderItem}
                  keyExtractor={item => item._key}
                />
              </List>
              { addButton }
            </Card>
          );
        }}
      </Query>
    );
  }
}

export default Players;


const styles = StyleSheet.create({
  listContainer: {
    marginTop: 0,
    marginBottom: 10
  }
});
