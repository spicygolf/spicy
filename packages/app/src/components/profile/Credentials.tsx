import Clipboard from "@react-native-clipboard/clipboard";
import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { KvStoreContext, useAccount } from "jazz-tools/react-native";
import { useEffect, useState } from "react";
// biome-ignore lint/style/noRestrictedImports: This component is a wrapper around the React Native component.
import { TextInput, TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { PlayerAccount } from "spicylib/schema";
import { Text } from "@/ui";

const CopyIcon = () => {
  const { theme } = useUnistyles();
  return <FontAwesome6 name="copy" size={12} color={theme.colors.secondary} />;
};

export function Credentials() {
  const [sealerSecret, setSealerSecret] = useState<string>("");

  useEffect(() => {
    const getSecret = async () => {
      const kvStoreContext = KvStoreContext.getInstance();
      const store = kvStoreContext.getStorage();
      const jlis = await store.get("jazz-logged-in-secret");
      if (jlis) {
        try {
          const parsed = JSON.parse(jlis);
          // accountSecret format: "signer_secret/sealer_secret"
          const parts = parsed.accountSecret?.split("/") ?? [];
          if (parts.length === 2) {
            setSealerSecret(parts[1]);
          }
        } catch {
          // Ignore parse errors
        }
      }
    };
    getSecret();
  }, []);

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
      <View style={styles.row}>
        <Text style={styles.label}>Sealer Secret</Text>
        <TextInput
          style={[styles.value, styles.secret]}
          value={sealerSecret}
          multiline
          editable={false}
        />
        <TouchableOpacity
          style={styles.copy}
          onPress={() => Clipboard.setString(sealerSecret)}
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
  secret: {
    color: theme.colors.secondary,
  },
}));
