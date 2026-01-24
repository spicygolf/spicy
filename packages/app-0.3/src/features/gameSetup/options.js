import { getAllOptions } from "common/utils/game";
import { GameContext } from "features/game/gameContext";
import Option from "features/gameSetup/option";
import { useContext } from "react";
import { FlatList } from "react-native";
import { Card } from "react-native-elements";

const Options = () => {
  const { game } = useContext(GameContext);
  const allOptions = getAllOptions({ game, type: "game" });
  // console.log('allOptions', allOptions);

  const renderOption = ({ item }) => {
    // console.log('renderOption item', item);
    return <Option item={item} />;
  };

  return (
    <Card>
      <Card.Title>Options</Card.Title>
      <Card.Divider />
      <FlatList data={allOptions} renderItem={renderOption} />
    </Card>
  );
};

export default Options;
