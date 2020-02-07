import React, { useContext } from 'react';

import BirdieEmAllLeaderboard from './components/birdie_em_all/leaderboard';
import FivePointsLeaderboard from './components/five_points/leaderboard';
import GameNotFound from './components/general/notfound';
import { GameContext } from 'features/game/gameContext';



const Leaderboard = (props) => {

  let Component = null;

  const { game } = useContext(GameContext);

  switch(game.gametype) {
    case "birdie_em_all":
      Component = BirdieEmAllLeaderboard;
      break;
    case "five_points":
      Component = FivePointsLeaderboard;
      break;
    default:
      Component = GameNotFound;
  }

  return <Component {...props}/>;

};

export default Leaderboard;
