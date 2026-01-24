import FavoriteIcon from "common/components/favoriteIcon";
import { StyleSheet, Text, View } from "react-native";
import { ListItem } from "react-native-elements";

const handicap = (h) => (
  <View>
    <Text style={styles.handicap}>{h}</Text>
  </View>
);

const Player = (props) => {
  const { item, testID, title, subtitle, hdcp, onPress } = props;
  //console.log('player', item);

  return (
    <ListItem
      containerStyle={styles.container}
      onPress={() => onPress(item)}
      testID={`add_player_favorites_${testID}`}
    >
      <FavoriteIcon fave={item.fave} />
      <ListItem.Content>
        <ListItem.Title>{title}</ListItem.Title>
        <ListItem.Subtitle style={styles.subtitle}>
          {subtitle}
        </ListItem.Subtitle>
      </ListItem.Content>
      {handicap(hdcp)}
    </ListItem>
  );
};

export default Player;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0,
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  handicap: {
    fontSize: 20,
    paddingRight: 10,
  },
  subtitle: {
    color: "#999",
    fontSize: 11,
  },
});
