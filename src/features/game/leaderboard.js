import React, { useContext } from 'react';

import BirdieEmAllLeaderboard from './components/birdie_em_all/leaderboard';
import PointsLeaderboard from './components/points/leaderboard';
import MatchPlayLeaderboard from './components/matchplay/leaderboard';
import GameNotFound from './components/general/notfound';
import { GameContext } from 'features/game/gameContext';



const Leaderboard = (props) => {

  let Component = null;

  const { activeGameSpec } = useContext(GameContext);
  if( !activeGameSpec ) {
    console.log('no active gamespec');
    return null;
  }

  switch(activeGameSpec.type) {
    case "birdie_em_all":
      Component = BirdieEmAllLeaderboard;
      break;
    case "points":
      Component = PointsLeaderboard;
      break;
    case 'match':
      Component = MatchPlayLeaderboard;
      break;
    default:
      Component = GameNotFound;
  }

  return <Component {...props}/>;

};

export default Leaderboard;
