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
  Card,
  Icon,
  List,
  ListItem
} from 'react-native-elements';

import { remove } from 'lodash';

import { GetPlayer } from 'features/players/graphql';

import { blue } from 'common/colors';

import { navigate } from 'common/components/navigationService';
import { removePlayer } from 'features/gameSetup/gameSetupFns';



class Players extends React.Component {

  constructor(props) {
    super(props);
    this._renderItem = this._renderItem.bind(this);
  }

  _renderItem({item}) {
    const handicap = (item && item.handicap && item.handicap.display) ?
      item.handicap.display : 'no handicap';

    return (
      <ListItem
        key={item._key}
        title={item.name || ''}
        subtitle={handicap}
        rightIcon={{name: 'remove-circle', color: 'red'}}
        onPress={() => navigate('player_item', {player: item})}
        onPressRightIcon={() => removePlayer(item._key)}
      />
    );
  }

  render() {

    if( !this.props.players ) return (<ActivityIndicator />);

    const addButton = ( this.props.showButton ) ?
      (
        <Icon
          name='add-circle'
          color={blue}
          size={40}
          title='Add Player'
          onPress={() => navigate('add_player')}
          testID='add_player_button'
        />
      ) : (<Icon name='add-circle' size={40} color='#fff'/>);

    const playersList = this.props.players.map(pkey => (
      <GetPlayer
        pkey={pkey}
        key={pkey}
      >
        {({ loading, player }) => {
          if( loading ) return null;
          return this._renderItem({item: player});
        }}
      </GetPlayer>
    ));

    return (
      <Card>
        <View style={styles.cardTitle}>
          <Icon name='add-circle' size={40} color='#fff'/>
          <Text style={styles.title}>Players</Text>
          { addButton }
        </View>
        <List containerStyle={styles.listContainer}>
          {playersList}
        </List>
      </Card>
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
