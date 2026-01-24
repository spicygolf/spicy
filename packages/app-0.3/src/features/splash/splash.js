import { Image, StyleSheet, View } from "react-native";

const Splash = (_props) => {
  const logo = require("../../../assets/img/logo200.png");

  return (
    <View style={styles.container}>
      <Image source={logo} />
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#b30000",
    flex: 1,
    justifyContent: "center",
  },
});
