import { GameContext } from 'features/game/gameContext';
import React, { useContext } from 'react';

import GameNotFound from './components/general/notfound';
import MatchPlayLeaderboard from './components/matchplay/leaderboard';
import PointsLeaderboard from './components/points/leaderboard';

const Leaderboard = (props) => {
  let Component = null;

  const { activeGameSpec } = useContext(GameContext);
  if (!activeGameSpec) {
    console.log('no active gamespec');
    return null;
  }

  switch (activeGameSpec.type) {
    case 'points':
      Component = PointsLeaderboard;
      break;
    case 'match':
      Component = MatchPlayLeaderboard;
      break;
    default:
      Component = GameNotFound;
  }

  return <Component {...props} />;
};

export default Leaderboard;
