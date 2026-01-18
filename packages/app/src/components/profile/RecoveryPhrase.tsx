/**
 * Recovery Phrase Display
 *
 * Shows the user's recovery passphrase so they can copy/save it.
 * Important for account recovery if they lose access to their device.
 */

import Clipboard from "@react-native-clipboard/clipboard";
import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { usePassphraseAuth } from "jazz-tools/react-core";
import { useAccount } from "jazz-tools/react-native";
import { useState } from "react";
import { Alert, Pressable, TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { PlayerAccount, Settings } from "spicylib/schema";
import { Text, TextInput } from "@/ui";

export function RecoveryPhrase() {
  const { theme } = useUnistyles();
  const auth = usePassphraseAuth({ wordlist });
  const me = useAccount(PlayerAccount, {
    resolve: { root: { settings: true } },
  });
  const [isVisible, setIsVisible] = useState(false);

  // Only show if signed in
  if (auth.state !== "signedIn") {
    return null;
  }

  // Check if recovery phrase has been marked as saved
  // Must check if data is loaded first, then check the actual value
  const isLoaded = me?.$isLoaded && me.root?.$isLoaded;
  const isSaved =
    isLoaded &&
    me.root.$jazz.has("settings") &&
    me.root.settings?.$isLoaded &&
    me.root.settings.recoveryPhraseSaved === true;

  const handleCopy = () => {
    Clipboard.setString(auth.passphrase);
    Alert.alert(
      "Copied",
      "Recovery passphrase copied to clipboard. Store it somewhere safe (not on this device)!",
    );
  };

  const handleToggleVisibility = () => {
    if (!isVisible) {
      Alert.alert(
        "Show Recovery Passphrase?",
        "Anyone with this passphrase can access your account. Make sure no one is looking over your shoulder.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Show", onPress: () => setIsVisible(true) },
        ],
      );
    } else {
      setIsVisible(false);
    }
  };

  const handleMarkSaved = () => {
    if (me?.$isLoaded && me.root?.$isLoaded) {
      if (!me.root.$jazz.has("settings")) {
        me.root.$jazz.set(
          "settings",
          Settings.create(
            { recoveryPhraseSaved: true },
            { owner: me.root.$jazz.owner },
          ),
        );
      } else if (me.root.settings?.$isLoaded) {
        me.root.settings.$jazz.set("recoveryPhraseSaved", true);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recovery Passphrase</Text>
        {!isSaved && (
          <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
            <Text style={styles.badgeText}>Action needed</Text>
          </View>
        )}
      </View>

      {!isSaved && (
        <View
          style={[
            styles.warningBox,
            {
              backgroundColor: `${theme.colors.error}20`,
              borderColor: theme.colors.error,
            },
          ]}
        >
          <Text style={[styles.warningBoxText, { color: theme.colors.error }]}>
            Save your recovery phrase somewhere other than this device (password
            manager, written down, etc). It's the only way to recover your
            account.
          </Text>
        </View>
      )}

      <Text style={styles.description}>
        {isSaved
          ? "Your recovery phrase is saved. Use it to recover your account on another device."
          : "Save this passphrase to recover your account on another device."}
      </Text>

      <View style={styles.passphraseContainer}>
        {isVisible ? (
          <TextInput
            style={styles.passphrase}
            value={auth.passphrase}
            multiline
            editable={false}
            selectTextOnFocus
          />
        ) : (
          <View style={styles.hiddenContainer}>
            <Text style={styles.hiddenText}>••••••••••••••••••••••••</Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleToggleVisibility}
          >
            <FontAwesome6
              name={isVisible ? "eye-slash" : "eye"}
              size={16}
              color={theme.colors.secondary}
            />
            <Text style={styles.actionText}>{isVisible ? "Hide" : "Show"}</Text>
          </TouchableOpacity>

          {isVisible && (
            <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
              <FontAwesome6
                name="copy"
                size={16}
                color={theme.colors.secondary}
              />
              <Text style={styles.actionText}>Copy</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!isSaved && (
        <Pressable style={styles.checkboxRow} onPress={handleMarkSaved}>
          <View style={styles.checkbox} />
          <Text style={styles.checkboxLabel}>
            I have saved my recovery phrase somewhere other than this device
          </Text>
        </Pressable>
      )}

      <Text style={styles.warning}>
        Never share this passphrase. Anyone with it can access your account.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.gap(1),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
  },
  description: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  passphraseContainer: {
    marginBottom: 8,
  },
  passphrase: {
    fontFamily: "monospace",
    fontSize: 12,
    minHeight: 80,
    textAlignVertical: "top",
  },
  hiddenContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.gap(0.75),
    borderWidth: 0.75,
    borderColor: theme.colors.secondary,
    padding: theme.gap(1),
    minHeight: 80,
    justifyContent: "center",
  },
  hiddenText: {
    color: theme.colors.secondary,
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.background,
  },
  actionText: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  warning: {
    fontSize: 11,
    color: theme.colors.error,
    fontStyle: "italic",
  },
  warningBox: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  warningBoxText: {
    fontSize: 12,
    fontWeight: "600",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 4,
    backgroundColor: theme.colors.background,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.primary,
    lineHeight: 22,
  },
}));
