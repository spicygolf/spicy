'use strict';

import React from 'react';

import {
  ListItem
} from 'react-native-elements';

import { withNavigation } from 'react-navigation';

import { AddLinkMutation } from 'common/graphql/link';
import { GET_PLAYERS_FOR_GAME_QUERY } from 'features/players/graphql';
import FavoriteIcon from 'common/components/favoriteIcon';



class Player extends React.Component {

  render() {
    const { gkey, item, title, subtitle } = this.props;

    return (
      <AddLinkMutation>
        {({addLinkMutation}) => (
          <ListItem
            title={title}
            subtitle={subtitle}
            onPress={async () => {
              const {data, errors} = await addLinkMutation({
                variables: {
                  from: {type: 'player', value: item._key},
                  to: {type: 'game', value: gkey}
                },
                refetchQueries: () => [{
                  query: GET_PLAYERS_FOR_GAME_QUERY,
                  variables: {
                    gkey: gkey
                  }
                }],
                awaitRefetchQueries: true
              });
              if( errors ) {
                console.log('error adding player to game', errors);
              }
              this.props.navigation.navigate('GameSetup');
            }}
            leftIcon={(
              <FavoriteIcon
                fave={item.fave}
              />
            )}
          />
        )}
      </AddLinkMutation>
    );
  }

}

export default withNavigation(Player);
