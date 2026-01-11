import Clipboard from "@react-native-clipboard/clipboard";
import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useAccount } from "jazz-tools/react-native";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { PlayerAccount } from "spicylib/schema";
import { Text } from "@/ui";

const CopyIcon = () => {
  const { theme } = useUnistyles();
  return <FontAwesome6 name="copy" size={12} color={theme.colors.secondary} />;
};

export function Credentials() {
  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        player: true,
      },
    },
    select: (me) =>
      me.$isLoaded
        ? me
        : me.$jazz.loadingState === "loading"
          ? undefined
          : null,
  });
  if (!me?.$isLoaded) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Credentials</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Logged In As</Text>
        <Text style={styles.value}>
          {me.profile?.$isLoaded ? me.profile.name : ""}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Root Player Name</Text>
        <Text style={styles.value}>
          {me.root?.$isLoaded && me.root.player?.$isLoaded
            ? me.root.player.name
            : ""}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Account ID</Text>
        <Text style={styles.value}>{me.$jazz.id}</Text>
        <TouchableOpacity
          style={styles.copy}
          onPress={() => Clipboard.setString(me.$jazz.id)}
        >
          <CopyIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    paddingBottom: 10,
  },
  title: {
    fontWeight: "bold",
    paddingBottom: theme.gap(1),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.gap(1),
  },
  label: {
    fontSize: 10,
    fontWeight: "bold",
    width: "30%",
    paddingRight: 5,
    textAlign: "right",
  },
  value: {
    fontSize: 10,
    width: "60%",
  },
  copy: {
    width: "10%",
    alignItems: "center",
  },
}));
