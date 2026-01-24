import { findIndex } from "lodash";
import { StyleSheet, Text, View } from "react-native";
import { Icon } from "react-native-elements";

const sortNumber = (a, b) => a - b;

const HoleNav = (props) => {
  const { holes: holesOrig, holeInfo, changeHole } = props;

  const holes = holesOrig.sort(sortNumber);
  holes.push("Summary");
  const currentHoleIndex = findIndex(holes, (h) => {
    return h === holeInfo.hole;
  });

  let holeInfoContent = null;
  if (holeInfo.par && holeInfo.length && holeInfo.handicap) {
    holeInfoContent = (
      <Text style={styles.holeInfo}>
        Par: <Text style={styles.holeInfoValue}>{holeInfo.par} </Text>
        Yds: <Text style={styles.holeInfoValue}>{holeInfo.length} </Text>
        Hdcp: <Text style={styles.holeInfoValue}>{holeInfo.handicap}</Text>
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.direction}>
        <Icon
          name="chevron-left"
          size={40}
          onPress={() => {
            let newHoleIndex = currentHoleIndex - 1;
            if (newHoleIndex < 0) {
              newHoleIndex = holes.length - 1;
            }
            changeHole(holes[newHoleIndex].toString());
          }}
          testID={"holeNav_prev"}
        />
      </View>
      <View style={styles.currentHole}>
        <Text style={styles.holeText}>{holeInfo.hole}</Text>
        {holeInfoContent}
      </View>
      <View style={styles.direction}>
        <Icon
          name="chevron-right"
          size={40}
          onPress={() => {
            let newHoleIndex = currentHoleIndex + 1;
            if (newHoleIndex >= holes.length) {
              newHoleIndex = 0;
            }
            changeHole(holes[newHoleIndex].toString());
          }}
          testID={"holeNav_next"}
        />
      </View>
    </View>
  );
};

export default HoleNav;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  currentHole: {
    flex: 3,
    //flexDirection: 'row',
    alignItems: "center",
    justifyContent: "center",
  },
  direction: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  holeInfo: {
    fontSize: 9,
  },
  holeInfoValue: {
    fontWeight: "bold",
  },
  holeText: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
