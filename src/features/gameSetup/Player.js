'use strict';

import React from 'react';

import {
  ListItem
} from 'react-native-elements';

import { withNavigation } from 'react-navigation';

import { AddLinkMutation } from 'common/graphql/link';
import { GET_GAME_QUERY } from 'features/games/graphql';
import FavoriteIcon from 'common/components/favoriteIcon';



class Player extends React.Component {

  constructor(props) {
    super(props);
    console.log('Player props', props);
  }

  render() {
    const { game, team, item, title, subtitle } = this.props;
    const { _key:gkey, start:game_start } = game;
    const pkey = item._key;

    let others = [];
    if( team ) others.push({key: 'team', value: team});

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
                  to: {type: 'game', value: gkey},
                  other: others
                },
                refetchQueries: () => [{
                  query: GET_GAME_QUERY,
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
