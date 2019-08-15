import React from 'react';

import BirdieEmAllScore from './components/birdie_em_all/score';
import FivePointsScore from './components/five_points/score';
import GameNotFound from './components/general/notfound';



const Score = (props) => {

  let Component = null;

  switch( props.screenProps.game.gametype) {
    case 'birdie_em_all':
      Component = BirdieEmAllScore;
      break;
    case "five_points":
      Component = FivePointsScore;
      break;
    default:
      Component = GameNotFound;
  }

  return <Component {...props}/>;

};

export default Score;
