import { blue } from "common/colors";
import { find, orderBy } from "lodash";
import { FlatList, StyleSheet, View } from "react-native";
import { Button, Icon } from "react-native-elements";

const TeamJunk = (props) => {
  const { team: teamNum, scoring, currentHole } = props;

  const renderJunk = (junk) => {
    if (junk.show_in === "none") {
      return null;
    }

    // TODO: junk.name needs l10n, i18n - use junk.name as slug
    const type = "solid";
    const color = "white";

    return (
      <Button
        title={junk.disp}
        icon={
          <Icon style={styles.icon} name={junk.icon} size={20} color={color} />
        }
        type={type}
        buttonStyle={styles.button}
        titleStyle={styles.buttonTitle}
      />
    );
  };

  const hole = find(scoring.holes, { hole: currentHole });
  if (!hole) {
    return null;
  }

  const team = find(hole.teams, { team: teamNum });
  if (!team) {
    return null;
  }

  // team junk for single-player teams will be under holeJunk
  if (team.players && team.players.length === 1) {
    return null;
  }

  const sorted_junk = orderBy(team.junk, ["seq"], ["asc"]);
  if (sorted_junk.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        horizontal={true}
        data={sorted_junk}
        renderItem={({ item }) => renderJunk(item)}
        keyExtractor={(item) => item.seq.toString()}
      />
    </View>
  );
};

export default TeamJunk;

const styles = StyleSheet.create({
  button: {
    borderColor: blue,
    marginRight: 5,
    padding: 2,
  },
  buttonTitle: {
    fontSize: 13,
    paddingBottom: 5,
    paddingRight: 10,
    paddingTop: 5,
  },
  container: {
    flex: 1,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 0,
  },
  icon: {
    padding: 5,
  },
});
