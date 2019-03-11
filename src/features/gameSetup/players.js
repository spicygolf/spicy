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
  List,
  ListItem
} from 'react-native-elements';

import { find, remove } from 'lodash';

import { GetPlayer } from 'features/players/graphql';

import { blue } from 'common/colors';

import { navigate } from 'common/components/navigationService';
import { RemoveLinkMutation } from 'common/graphql/unlink';



class Players extends React.Component {

  constructor(props) {
    super(props);
    this._itemPressed = this._itemPressed.bind(this);
    this._renderItem = this._renderItem.bind(this);
  }

  _itemPressed(tee) {
    navigate('player_item', {tee: tee});
  }

  _renderItem(player) {
    if( player && player.name ) {
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
                onPress={() => this._itemPressed(player)}
                onPressRightIcon={async () => {
                  const {data, errors} = await removeLinkMutation({
                    variables: {
                      from: {type: 'game', value: gkey},
                      to: {type: 'player', value: player._key}
                    },
                    update: (cache, result) => {
                      // TODO: all wrong for players
                      /*
                      cache.writeQuery({
                        query: GET_PLAYER_FOR_GAME_QUERY,
                        variables: {gkey: gkey},
                        data: {GetPlayerForGame: {}}
                      });
                      */
                    },
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
