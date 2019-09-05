import React from 'react';
import {
  ActivityIndicator,
  Text,
  View
} from 'react-native';

import moment from 'moment';

import { GetRoundsForPlayerDay } from 'features/rounds/graphql';
import Rounds from './rounds';



class LinkRound extends React.Component {

  constructor(props) {
    super(props);
    const game_start = props.navigation.getParam('game_start');
    const pkey = props.navigation.getParam('pkey');
    const gkey = props.navigation.getParam('gkey');

    this.state = {
      game_start: moment.utc(game_start).format('YYYY-MM-DD'),
      pkey: pkey,
      gkey: gkey,
    };
  }

  render() {
    const { game_start, pkey, gkey } = this.state;

    // see if player already has round(s) for the day of this game
    return (
      <GetRoundsForPlayerDay
        day={game_start}
        pkey={pkey}
      >
        {({ loading, rounds }) => {
          if( loading ) return (<ActivityIndicator />);
          if( rounds && Array.isArray(rounds) ) {
            return (
              <Rounds
                rounds={rounds}
                game_start={game_start}
                pkey={pkey}
                gkey={gkey}
                navigation={this.props.navigation}
              />
            );
          }
          return null;
        }}
      </GetRoundsForPlayerDay>
    );
  }

}

export default LinkRound;