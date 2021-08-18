import Leaderboard from 'common/components/leaderboard';
import React from 'react';

const PointsLeaderboard = (props) => {
  return (
    <Leaderboard
      activeChoices={['gross', 'net', 'points']}
      initialScoreType="points"
      teams={false}
    />
  );
};

export default PointsLeaderboard;
