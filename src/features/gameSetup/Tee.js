'use strict';

import React from 'react';

import {
  ListItem
} from 'react-native-elements';

import { withNavigation } from 'react-navigation';

import { AddLinkMutation } from 'common/graphql/link';
import { GET_GAME_QUERY } from 'features/games/graphql';
import FavoriteIcon from 'common/components/favoriteIcon';
import { calc_course_handicaps } from 'common/utils/handicap';



const Tee = props => {

  //console.log('Tee props', props);
  const { gkey, rkey, oldTee, item, title, subtitle, rounds } = props;
  const assigned = oldTee ? "manual" : "first";

  // TODO: RemoveLinkMutation - (if oldTee != null)
  if( oldTee ) {
    // we need to remove this edge and replace with new one
    console.log('oldTee', oldTee);
  }

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
                query: GET_GAME_QUERY,
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

            // after all that, go back to GameSetup
            props.navigation.navigate('GameSetup');
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

};

export default withNavigation(Tee);
