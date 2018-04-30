import React from 'react';

import BirdieEmAllLeaderboard from './components/birdie_em_all/leaderboard';

const Leaderboard = (props) => {

  let Component = null;

  switch(props.currentGame.gametype) {
    case "birdie_em_all":
      Component = BirdieEmAllLeaderboard;
  }

  return <Component {...props}/>;

};

export default Leaderboard;
