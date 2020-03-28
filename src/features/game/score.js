import React, { useContext } from 'react';

import BirdieEmAllScore from './components/birdie_em_all/score';
import FivePointsScore from './components/five_points/score';
import GameNotFound from './components/general/notfound';
import { GameContext } from 'features/game/gameContext';



const Score = (props) => {

  return (<FivePointsScore {...props} />);
  // TODO: deal with multiple gamespecs attached to same game
  // maybe a general 'category' of games that have to be similar to be
  // attached to the same game?


  let Component = null;

  const { game } = useContext(GameContext);

  switch( game.gametype) {
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
