import Leaderboard from 'common/components/leaderboard';
import React from 'react';

const MatchPlayLeaderboard = (props) => {
  return (
    <Leaderboard
      activeChoices={['gross', 'net', 'match']}
      initialScoreType="match"
      teams={true}
    />
  );
};

export default MatchPlayLeaderboard;
