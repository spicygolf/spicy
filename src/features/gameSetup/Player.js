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
    const pkey = item._key;
    // TODO: game_start needs to be here somehow
    const game_start = '2019-06-15T16:44:35Z';

    return (
      <AddLinkMutation>
        {({addLinkMutation}) => (
          <ListItem
            title={title}
            subtitle={subtitle}
            onPress={async () => {
              // link player to game
              const {data, errors} = await addLinkMutation({
                variables: {
                  from: {type: 'player', value: pkey},
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
              // setup round for player
              this.props.navigation.navigate('LinkRound', {
                game_start: game_start,
                pkey: pkey,
                player: item,
                gkey: gkey
              });
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
