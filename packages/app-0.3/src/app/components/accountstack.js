import { createStackNavigator } from "@react-navigation/stack";
import Forgot from "features/account/forgot";
import Login from "features/account/login";
import Register from "features/account/register";
import { SafeAreaView, StyleSheet } from "react-native";

const AccountStack = (_props) => {
  const Stack = createStackNavigator();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Navigator initialRouteName="Login" headerMode="none">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Forgot" component={Forgot} />
      </Stack.Navigator>
    </SafeAreaView>
  );
};

export default AccountStack;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#b30000",
    flex: 1,
  },
});
