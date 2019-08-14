import React from 'react';

import BirdieEmAllScore from './components/birdie_em_all/score';

const Score = (props) => {

  let Component = null;

  switch( props.currentGame.gametype) {
    case 'birdie_em_all':
      Component = BirdieEmAllScore;
  }

  return <Component {...props}/>;

};

export default Score;
