import { query as getGameQuery } from "features/game/hooks/useGetGameQuery";
import { useRemovePlayerFromGameMutation } from "features/gameSetup/hooks/useRemovePlayerFromGameMutation";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Icon } from "react-native-elements";

import ErrorModal from "../../common/components/errorModal";

const RemovePlayer = (props) => {
  const { pkey, gkey, rkey } = props;
  const [showError, setShowError] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removePlayerFromGame, { error }] = useRemovePlayerFromGameMutation();

  let resp = {};

  const toggle = () => {
    setShowError(!showError);
  };

  const removePlayer = async () => {
    setIsRemoving(true);
    resp = await removePlayerFromGame({
      variables: {
        pkey,
        gkey,
        rkey,
      },
      refetchQueries: () => [
        {
          query: getGameQuery,
          variables: {
            gkey: gkey,
          },
        },
      ],
      awaitRefetchQueries: true,
    });

    if (error || resp?.success === false) {
      setShowError(true);
    }
  };

  let icon = (
    <Icon name="remove-circle" color="red" onPress={() => removePlayer()} />
  );
  if (isRemoving) {
    icon = <ActivityIndicator />;
  }
  // TODO: the modal doesn't seem to fire when the API is shut off.
  //       Only Apollo GraphQL errors are in yellow box :(
  return (
    <View>
      {icon}
      <ErrorModal visible={showError} toggle={toggle} error={error || resp} />
    </View>
  );
};

export default RemovePlayer;
