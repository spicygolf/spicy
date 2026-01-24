import Leaderboard from "common/components/leaderboard";

const MatchPlayLeaderboard = (_props) => {
  return (
    <Leaderboard
      activeChoices={["gross", "net", "match"]}
      initialScoreType="match"
      teams={true}
    />
  );
};

export default MatchPlayLeaderboard;
