'use strict';

import React from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { Query, withApollo } from 'react-apollo';
import moment from 'moment';


import { ListItem } from 'react-native-elements';

import GameNav from 'features/games/gamenav';

import {
  GAMESPECS_FOR_PLAYER_QUERY,
  AddGameMutation
} from 'features/games/graphql';
import { AddLinkMutation } from 'common/graphql/link';



class NewGame extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      currentPlayerKey: props.navigation.getParam('currentPlayerKey')
    };
    this._renderItem = this._renderItem.bind(this);
  }

  _renderItem({item}) {
    return (
      <AddGameMutation>
        {({addGameMutation}) => (
          <AddLinkMutation>
            {({addLinkMutation}) => (
              <ListItem
                roundAvatar
                title={item.name || ''}
                subtitle={item.type || ''}
                onPress={async () => {
                  const {data: game_data, errors: game_errors} = await addGameMutation({
                    variables: {
                      game: {
                        name: item.name,
                        start: moment.utc().format(),
                        gametype: item._key,
                        options: item.defaultOptions || {}
                      }
                    }
                  });
                  const { _key: gkey } = game_data.addGame;
                  const {data: gp_data, errors: gp_errors} = await addLinkMutation({
                    variables: {
                      from: {type: 'player', value: this.state.currentPlayerKey},
                      to: {type: 'game', value: gkey},
                      other: [{key: 'created_by', value: 'true'}]
                    }
                  });
                  if( (!game_errors || game_errors.length == 0 ) &&
                      (!gp_errors || gp_errors.length == 0 ) ) {
                    this.props.navigation.navigate('GameSetup', {
                      gkey: gkey,
                      gametype: item._key,
                      options: item.defaultOptions || {}
                    });
                  } else {
                    console.log('addGameMutation did not work', errors);
                  }
                }}
                testID={`new_${item._key}`}
              />
            )}
          </AddLinkMutation>
        )}
      </AddGameMutation>
    );
  }


  render() {

    return (
      <Query
        query={GAMESPECS_FOR_PLAYER_QUERY}
        variables={{pkey: this.state.currentPlayerKey}}
        fetchPolicy='cache-and-network'
      >
        {({ data, loading, error}) => {
          if( loading ) return (<ActivityIndicator />);

          // TODO: error component instead of below...
          if( error || !data.gameSpecsForPlayer ) {
            console.log(error);
            return (<Text>Error</Text>);
          }

          return (
            <View>
              <GameNav
                title='New Game'
                showBack={true}
              />
              <FlatList
                data={data.gameSpecsForPlayer}
                renderItem={this._renderItem}
                keyExtractor={item => item._key}
              />
            </View>
          );
        }}
      </Query>
    );
  }
}

export default withApollo(NewGame);
