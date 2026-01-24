import { getRatings } from "common/utils/game";
import {
  query,
  useGetFavoriteTeesForPlayerQuery,
} from "features/courses/useGetFavoriteTeesForPlayerQuery";
import { GameContext } from "features/game/gameContext";
import Tee from "features/gameSetup/Tee";
import { useContext } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

const AddCourseFavorites = (_props) => {
  const { game, currentPlayerKey } = useContext(GameContext);

  const _renderFavoritesTee = ({ item }) => {
    const { rating, slope } = getRatings(game.scope.holes, item);
    return (
      <Tee
        item={item}
        title={item.course.course_name}
        subtitle={`${item.tee_name} - ${rating}/${slope}`}
      />
    );
  };

  const { loading, error, data } = useGetFavoriteTeesForPlayerQuery({
    variables: {
      pkey: currentPlayerKey,
      gametime: game.start,
    },
    fetchPolicy: "cache-and-network",
  });

  if (loading) {
    return <ActivityIndicator />;
  }
  if (error) {
    return <Text>Error! {error.message}</Text>;
  }

  const tees = data?.getFavoriteTeesForPlayer
    ? data.getFavoriteTeesForPlayer
    : [];
  //console.log('tees', tees, currentPlayerKey);

  const newTees = tees.map((tee) => ({
    ...tee,
    fave: {
      faved: true,
      from: { type: "player", value: currentPlayerKey },
      to: { type: "tee", value: tee.tee_id },
      refetchQueries: [
        {
          query,
          variables: {
            pkey: currentPlayerKey,
            gametime: game.start,
          },
        },
      ],
    },
  }));
  //console.log('newTees', newTees);

  return (
    <View style={styles.container}>
      <View style={styles.listContainer}>
        <FlatList
          data={newTees}
          renderItem={_renderFavoritesTee}
          keyExtractor={(item) => item.tee_id.toString()}
          keyboardShouldPersistTaps={"handled"}
        />
      </View>
    </View>
  );
};

export default AddCourseFavorites;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    marginBottom: 50,
    marginTop: 0,
  },
});
