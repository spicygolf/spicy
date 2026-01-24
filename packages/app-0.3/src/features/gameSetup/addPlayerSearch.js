import { useNavigation } from "@react-navigation/native";
import SpicySearchPlayer from "common/components/spicy/player/search";
import { GameContext } from "features/game/gameContext";
import { useContext, useState } from "react";
import { Text } from "react-native";

const AddPlayerSearch = (_props) => {
  const defaultNewPlayer = {
    search: "",
  };

  const [newPlayer, setNewPlayer] = useState(defaultNewPlayer);

  const navigation = useNavigation();
  const { game } = useContext(GameContext);

  let content = null;

  if (newPlayer?.name) {
    console.log("newPlayer", newPlayer);
    content = <Text>new player: {newPlayer.name}</Text>;
  } else {
    content = (
      <SpicySearchPlayer
        state={newPlayer}
        setState={setNewPlayer}
        onPress={(item) => {
          //console.log('player pressed', item);
          const player = {
            _key: item._key,
            name: item.name,
            handicap: item.handicap,
          };
          navigation.navigate("LinkRoundList", { game, player });
        }}
      />
    );
  }

  return content;
};

export default AddPlayerSearch;
