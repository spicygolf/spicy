import React from 'react';

import Leaderboard from 'common/components/leaderboard';



const MatchPlayLeaderboard = props => {

  return (
    <Leaderboard
      activeChoices={['gross', 'net', 'match']}
      initialScoreType='match'
      teams={true}
    />
  );

};


export default MatchPlayLeaderboard;
