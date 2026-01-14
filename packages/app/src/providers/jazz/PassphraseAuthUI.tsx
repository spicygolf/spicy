/**
 * Passphrase Auth UI for Development
 *
 * Uses Jazz's passphrase auth for dev/simulator since passkeys don't work
 * in iOS Simulator or Android Emulator. Will be replaced with passkey UI
 * once Jazz passkey PR is merged.
 */

import Clipboard from "@react-native-clipboard/clipboard";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { usePassphraseAuth } from "jazz-tools/react-core";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text, TextInput } from "@/ui";

interface PassphraseAuthUIProps {
  children: React.ReactNode;
}

export function PassphraseAuthUI({ children }: PassphraseAuthUIProps) {
  const auth = usePassphraseAuth({ wordlist });

  const [step, setStep] = useState<"initial" | "create" | "login">("initial");
  const [loginPassphrase, setLoginPassphrase] = useState("");
  const [name, setName] = useState("");
  const [currentPassphrase, setCurrentPassphrase] = useState(() =>
    auth.generateRandomPassphrase(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [confirmSaved, setConfirmSaved] = useState(false);

  if (auth.state === "signedIn") {
    return <>{children}</>;
  }

  const handleCreateAccount = () => {
    setStep("create");
  };

  const handleLogin = () => {
    setStep("login");
  };

  const handleReroll = () => {
    const newPassphrase = auth.generateRandomPassphrase();
    setCurrentPassphrase(newPassphrase);
    setConfirmSaved(false); // Reset confirmation when passphrase changes
  };

  const handleCopyPassphrase = () => {
    Clipboard.setString(currentPassphrase);
    Alert.alert("Copied", "Passphrase copied to clipboard. Store it safely!");
  };

  const handleBack = () => {
    setStep("initial");
    setLoginPassphrase("");
    setName("");
  };

  const handleLoginSubmit = async () => {
    if (!loginPassphrase.trim()) {
      Alert.alert("Error", "Please enter your passphrase");
      return;
    }

    setIsLoading(true);
    try {
      await auth.logIn(loginPassphrase.trim());
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Login Failed",
        "Invalid passphrase. Please check and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    setIsLoading(true);
    try {
      await auth.registerNewAccount(currentPassphrase, name.trim());
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Registration Failed", "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {step === "initial" && (
          <View style={styles.content}>
            <Text style={styles.title}>Spicy Golf</Text>
            <Text style={styles.subtitle}>Development Mode</Text>
            <View style={styles.buttonGroup}>
              <View testID="create-account-button">
                <Button title="Create Account" onPress={handleCreateAccount} />
              </View>
              <View style={styles.buttonSpacer} />
              <View testID="login-button">
                <Button title="Log In" onPress={handleLogin} />
              </View>
            </View>
          </View>
        )}

        {step === "create" && (
          <View style={styles.content}>
            <Text style={styles.title}>Create Account</Text>

            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              autoCapitalize="words"
              autoCorrect={false}
            />

            <Text style={styles.label}>Recovery Passphrase</Text>
            <Text style={styles.description}>
              Save this passphrase securely. You'll need it to log in on other
              devices or if you get logged out.
            </Text>
            <TextInput
              style={styles.passphraseInput}
              value={currentPassphrase}
              onChangeText={(text) => {
                setCurrentPassphrase(text);
                setConfirmSaved(false);
              }}
              placeholder="Enter or generate a passphrase"
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.buttonRow}>
              <Button title="Generate New" onPress={handleReroll} />
              <View style={styles.buttonSpacer} />
              <Button title="Copy" onPress={handleCopyPassphrase} />
            </View>

            <Pressable
              style={styles.checkboxRow}
              onPress={() => setConfirmSaved(!confirmSaved)}
            >
              <View
                style={[
                  styles.checkbox,
                  confirmSaved && styles.checkboxChecked,
                ]}
              >
                {confirmSaved && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I have securely saved my recovery passphrase
              </Text>
            </Pressable>

            <View style={styles.buttonRow}>
              <Button title="Back" onPress={handleBack} />
              <View style={styles.buttonSpacer} />
              {isLoading ? (
                <ActivityIndicator />
              ) : (
                <Button
                  title="Create Account"
                  onPress={handleRegister}
                  disabled={!confirmSaved}
                />
              )}
            </View>
          </View>
        )}

        {step === "login" && (
          <View style={styles.content}>
            <Text style={styles.title}>Log In</Text>
            <Text style={styles.description}>
              Enter your recovery passphrase to log in.
            </Text>
            <TextInput
              style={styles.passphraseInput}
              value={loginPassphrase}
              onChangeText={setLoginPassphrase}
              placeholder="Enter your passphrase"
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.buttonRow}>
              <Button title="Back" onPress={handleBack} />
              <View style={styles.buttonSpacer} />
              {isLoading ? (
                <ActivityIndicator />
              ) : (
                <View testID="login-submit-button">
                  <Button title="Log In" onPress={handleLoginSubmit} />
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 24,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: theme.colors.secondary,
    marginTop: -8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  description: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: -8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.colors.background,
    color: theme.colors.primary,
  },
  passphraseInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: "monospace",
    backgroundColor: theme.colors.background,
    color: theme.colors.primary,
    minHeight: 100,
    textAlignVertical: "top",
  },
  buttonGroup: {
    gap: 12,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  buttonSpacer: {
    width: 16,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: "bold",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.primary,
    lineHeight: 22,
  },
}));
