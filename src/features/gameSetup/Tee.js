'use strict';

import React from 'react';

import {
  ListItem
} from 'react-native-elements';

import { withNavigation } from 'react-navigation';

import { AddLinkMutation } from 'common/graphql/link';
import { GET_PLAYERS_FOR_GAME_QUERY } from 'features/players/graphql';
import FavoriteIcon from 'common/components/favoriteIcon';
import { calc_course_handicaps } from 'common/utils/handicap';



class Tee extends React.Component {
  render() {
    const { gkey, rkey, oldTee, item, title, subtitle } = this.props;
    //console.log('Tee props', this.props);
    const assigned = oldTee ? "manual" : "first";

    // TODO: RemoveLinkMutation - (if oldTee != null)

    // TODO: move this to Apollo Hooks instead of React.Component?
    //       maybe not due to withNavigation...

    return (
      <AddLinkMutation>
        {({addLinkMutation}) => (
          <ListItem
            title={title}
            subtitle={subtitle}
            onPress={async () => {
              const {data, errors} = await addLinkMutation({
                variables: {
                  from: {type: 'round', value: rkey},
                  to: {type: 'tee', value: item._key},
                  other: [{key: "assigned", value: assigned}],
                },
                refetchQueries: () => [{
                  query: GET_PLAYERS_FOR_GAME_QUERY,
                  variables: {
                    gkey: gkey
                  }
                }],
                awaitRefetchQueries: true,
              });
              if( errors ) {
                console.log('error adding tee to round', errors);
              }

              // TODO: add the same tee to the other players' rounds in this
              //       game, unless they have round2tee already.


              // here is one place we calc the course_handicap
              // on the round2game edges
              //calc_course_handicaps(gkey);

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

export default withNavigation(Tee);
