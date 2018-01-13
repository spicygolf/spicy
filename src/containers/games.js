'use strict';

import React from 'react';

import {
  View
} from 'react-native';

import Header from '../components/header';
import GameList from '../components/gamelist';

import { green } from '../lib/colors';

class Games extends React.Component {

  render() {

    // TODO: tabs for active, done, etc.?
    // TODO: search? scroll back thru dates, opponents?

    return (
      <View>
        <GameList
          {...this.props}
          username='anderson'/>
      </View>
    );
  }
};

export default Games;
