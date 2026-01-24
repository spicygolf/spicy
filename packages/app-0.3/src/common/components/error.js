import { SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";

const Error = (props) => {
  const { error } = props;

  return (
    <SafeAreaView>
      <Text style={styles.title}>Sorry, the app just took a double bogey.</Text>
      <ScrollView>
        <Text style={styles.message}>{JSON.stringify(error, null, 2)}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Error;

export const styles = StyleSheet.create({
  title: {
    alignSelf: "center",
    fontWeight: "bold",
  },
  message: {
    fontFamily: "Courier New",
    fontSize: 9,
  },
});
