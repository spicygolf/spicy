import { addFavesToTee } from "common/utils/tees";
import { GameContext } from "features/game/gameContext";
import { AddCourseContext } from "features/gameSetup/addCourseContext";
import TeeList from "features/gameSetup/TeeList";
import { orderBy } from "lodash";
import { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";

// import { useGetFavoriteTeesForPlayerQuery } from 'features/courses/useGetFavoriteTeesForPlayerQuery';

const AddCourseSelectedTees = (_props) => {
  const { game, currentPlayerKey } = useContext(GameContext);
  const { tees } = useContext(AddCourseContext);

  if (tees.length === 0) {
    return null;
  }

  // const faves = useGetFavoriteTeesForPlayerQuery({
  //   variables: {
  //     pkey: currentPlayerKey,
  //     gametime: game.start,
  //   },
  // });

  // if (faves.loading) {
  //   return <ActivityIndicator />;
  // }
  // if (faves.error) {
  //   console.log(error);
  //   // TODO: error component
  //   return <Text>Error</Text>;
  // }

  // const faveTees = faves.data?.getFavoriteTeesForPlayer ?? [];
  const faves = [];

  // decorate existing with faves data
  let selected = tees.map((tee) =>
    addFavesToTee({
      tee,
      faves,
      game,
      currentPlayerKey,
    }),
  );
  selected = orderBy(tees, ["gender", "order"], ["desc", "desc"]);

  return (
    <View>
      <Text style={styles.label}>selected tees for game</Text>
      <TeeList tees={selected} showRemove={true} allowAddToRound={false} />
    </View>
  );
};

export default AddCourseSelectedTees;

const styles = StyleSheet.create({
  label: {
    marginHorizontal: 10,
    marginVertical: 3,
    fontSize: 10,
    alignSelf: "center",
  },
});
