'use strict';

import React from 'react';

import {
  ListItem
} from 'react-native-elements';

import { withNavigation } from 'react-navigation';

import { AddLinkMutation } from 'common/graphql/link';
import { GET_TEE_FOR_GAME_QUERY } from 'features/courses/graphql';
import FavoriteIcon from 'common/components/favoriteIcon';
import { calc_course_handicaps } from 'common/utils/handicap';



class Tee extends React.Component {

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
                  from: {type: 'game', value: gkey},
                  to: {type: 'tee', value: item._key}
                },
                refetchQueries: () => [{
                  query: GET_TEE_FOR_GAME_QUERY,
                  variables: {
                    gkey: gkey
                  }
                }],
                awaitRefetchQueries: true
              });
              if( errors ) {
                console.log('error adding tee to game', errors);
              }
              // TODO: here is one place we should calc the course_handicap
              //       on the round2game edges
              calc_course_handicaps(item, gkey);
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
