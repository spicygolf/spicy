import Leaderboard from "common/components/leaderboard";

const PointsLeaderboard = (_props) => {
  return (
    <Leaderboard
      activeChoices={["gross", "net", "points"]}
      initialScoreType="points"
      teams={false}
    />
  );
};

export default PointsLeaderboard;
