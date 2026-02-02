import Clipboard from "@react-native-clipboard/clipboard";
import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useAccount } from "jazz-tools/react-native";
import { useState } from "react";
import { Alert, TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { PlayerAccount } from "spicylib/schema";
import { Text, TextInput } from "@/ui";

const CopyIcon = () => {
  const { theme } = useUnistyles();
  return <FontAwesome6 name="copy" size={12} color={theme.colors.secondary} />;
};

const EditIcon = () => {
  const { theme } = useUnistyles();
  return (
    <FontAwesome6
      name="pen"
      iconStyle="solid"
      size={10}
      color={theme.colors.secondary}
    />
  );
};

const CheckIcon = () => {
  const { theme } = useUnistyles();
  return (
    <FontAwesome6
      name="check"
      iconStyle="solid"
      size={12}
      color={theme.colors.action}
    />
  );
};

const XIcon = () => {
  const { theme } = useUnistyles();
  return (
    <FontAwesome6
      name="xmark"
      iconStyle="solid"
      size={12}
      color={theme.colors.secondary}
    />
  );
};

export function Credentials() {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

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

  const currentName =
    me.root?.$isLoaded && me.root.player?.$isLoaded ? me.root.player.name : "";

  const handleStartEdit = (): void => {
    setEditedName(currentName);
    setIsEditingName(true);
  };

  const handleSave = (): void => {
    if (!me.root?.$isLoaded || !me.root.player?.$isLoaded) {
      Alert.alert("Error", "Account not loaded");
      return;
    }

    const trimmedName = editedName.trim();
    if (!trimmedName) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    me.root.player.$jazz.set("name", trimmedName);
    me.root.player.$jazz.set("short", trimmedName.substring(0, 3));
    setIsEditingName(false);
  };

  const handleCancel = (): void => {
    setIsEditingName(false);
  };

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
        {isEditingName ? (
          <>
            <TextInput
              style={styles.editInput}
              value={editedName}
              onChangeText={setEditedName}
              autoFocus
            />
            <TouchableOpacity style={styles.iconButton} onPress={handleSave}>
              <CheckIcon />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleCancel}>
              <XIcon />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.value}>{currentName}</Text>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleStartEdit}
            >
              <EditIcon />
            </TouchableOpacity>
          </>
        )}
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Account ID</Text>
        <Text style={styles.value}>{me.$jazz.id}</Text>
        <TouchableOpacity
          style={styles.iconButton}
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
    flex: 1,
  },
  iconButton: {
    width: 24,
    alignItems: "center",
  },
  editInput: {
    flex: 1,
    fontSize: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
}));
