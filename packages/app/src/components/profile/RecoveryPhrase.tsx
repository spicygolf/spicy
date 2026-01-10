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
import { useState } from "react";
import { Alert, TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text, TextInput } from "@/ui";

export function RecoveryPhrase() {
  const { theme } = useUnistyles();
  const auth = usePassphraseAuth({ wordlist });
  const [isVisible, setIsVisible] = useState(false);

  // Only show if signed in
  if (auth.state !== "signedIn") {
    return null;
  }

  const handleCopy = () => {
    Clipboard.setString(auth.passphrase);
    Alert.alert(
      "Copied",
      "Recovery passphrase copied to clipboard. Store it somewhere safe!",
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recovery Passphrase</Text>
      <Text style={styles.description}>
        Save this passphrase to recover your account on another device.
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

      <Text style={styles.warning}>
        Never share this passphrase. Anyone with it can access your account.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginBottom: 12,
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
}));
