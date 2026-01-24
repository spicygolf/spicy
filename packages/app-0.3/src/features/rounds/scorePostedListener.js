import { useScorePostedSubscription } from "features/rounds/hooks/useScorePostedSubscription";

const ScorePostedListener = ({ rkey }) => {
  const { loading, error, data } = useScorePostedSubscription({
    variables: { rkey },
  });

  if (loading) {
    return null;
  }
  if (error) {
    console.log("Error in ScorePostedListener", error);
  }

  if (data?.scorePosted) {
    console.log("data", data);
  }

  // non-display component
  return null;
};

export default ScorePostedListener;
