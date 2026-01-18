/**
 * Authentication UI with Passkey + Passphrase Fallback
 *
 * Primary: Passkey auth (FaceID/TouchID) for production on real devices
 * Fallback: Passphrase auth for:
 *   - Development mode (simulators don't support passkeys)
 *   - Users who prefer passphrase
 *   - Recovery when passkey is unavailable
 */

import Clipboard from "@react-native-clipboard/clipboard";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { usePassphraseAuth } from "jazz-tools/react-core";
import { useAccount } from "jazz-tools/react-native";
import { usePasskeyAuth } from "jazz-tools/react-native-core";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PlayerAccount, Settings } from "spicylib/schema";
import { Button, Text, TextInput } from "@/ui";

// Check if we're in development mode (simulators/emulators)
const isDev = __DEV__;

interface AuthUIProps {
  children: React.ReactNode;
}

export function AuthUI({ children }: AuthUIProps) {
  // Both auth methods available
  const passkeyAuth = usePasskeyAuth({
    appName: "Spicy Golf",
    rpId: "spicy.golf",
  });

  const passphraseAuth = usePassphraseAuth({ wordlist });

  // UI state
  const [authMode, setAuthMode] = useState<"initial" | "passphrase">("initial");
  const [step, setStep] = useState<
    "choose" | "create" | "login" | "save-recovery"
  >("choose");
  const [loginPassphrase, setLoginPassphrase] = useState("");
  const [name, setName] = useState("");
  const [currentPassphrase, setCurrentPassphrase] = useState(() =>
    passphraseAuth.generateRandomPassphrase(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [confirmSaved, setConfirmSaved] = useState(false);

  // Either auth method can sign us in
  const isSignedIn =
    passkeyAuth.state === "signedIn" || passphraseAuth.state === "signedIn";

  // Show children only if signed in AND not in recovery phrase onboarding
  if (isSignedIn && step !== "save-recovery") {
    return <>{children}</>;
  }

  // Show recovery phrase onboarding after passkey signup
  if (isSignedIn && step === "save-recovery") {
    return (
      <RecoveryPhraseOnboarding
        onComplete={() => setStep("choose")}
        passphraseAuth={passphraseAuth}
      />
    );
  }

  // Passkey handlers
  const handlePasskeySignUp = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name first");
      return;
    }

    setIsLoading(true);
    try {
      await passkeyAuth.signUp(name.trim());
      // After successful passkey signup, show recovery phrase
      setStep("save-recovery");
    } catch (error) {
      // Check if user cancelled the passkey prompt - don't show fallback alert
      const errorName = (error as Error)?.name;
      if (errorName === "NotAllowedError" || errorName === "AbortError") {
        // User cancelled - silently return so they can try again
        return;
      }

      console.error("Passkey signup error:", error);
      Alert.alert(
        "Passkey Unavailable",
        "Would you like to use a recovery passphrase instead?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Use Passphrase",
            onPress: () => {
              setAuthMode("passphrase");
              setStep("create");
            },
          },
        ],
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setIsLoading(true);
    try {
      await passkeyAuth.logIn();
    } catch (error) {
      // Check if user cancelled the passkey prompt - don't show fallback alert
      const errorName = (error as Error)?.name;
      if (errorName === "NotAllowedError" || errorName === "AbortError") {
        // User cancelled - silently return so they can try again
        return;
      }

      console.error("Passkey login error:", error);
      Alert.alert(
        "Passkey Unavailable",
        "Would you like to log in with your recovery passphrase?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Use Passphrase",
            onPress: () => {
              setAuthMode("passphrase");
              setStep("login");
            },
          },
        ],
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Passphrase handlers
  const handleReroll = () => {
    const newPassphrase = passphraseAuth.generateRandomPassphrase();
    setCurrentPassphrase(newPassphrase);
    setConfirmSaved(false);
  };

  const handleCopyPassphrase = () => {
    Clipboard.setString(currentPassphrase);
    Alert.alert("Copied", "Passphrase copied to clipboard. Store it safely!");
  };

  const handleBack = () => {
    if (authMode === "passphrase") {
      setAuthMode("initial");
    }
    setStep("choose");
    setLoginPassphrase("");
    setName("");
    setConfirmSaved(false);
  };

  const handlePassphraseLogin = async () => {
    if (!loginPassphrase.trim()) {
      Alert.alert("Error", "Please enter your passphrase");
      return;
    }

    setIsLoading(true);
    try {
      await passphraseAuth.logIn(loginPassphrase.trim());
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

  const handlePassphraseRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    setIsLoading(true);
    try {
      await passphraseAuth.registerNewAccount(currentPassphrase, name.trim());
      // Passphrase users already saved their phrase during creation
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Registration Failed", "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // In dev mode, skip passkey and go straight to passphrase
  const showPasskeyOptions = !isDev && authMode === "initial";

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Initial screen - choose auth method */}
          {step === "choose" && (
            <View style={styles.content}>
              <Text style={styles.title}>Spicy Golf</Text>
              {isDev && <Text style={styles.subtitle}>Development Mode</Text>}

              {showPasskeyOptions ? (
                // Production: Show passkey as primary option
                <View style={styles.buttonGroup}>
                  <Text style={styles.label}>Your Name</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />

                  <View style={styles.buttonSpacer} />

                  {isLoading ? (
                    <ActivityIndicator size="large" />
                  ) : (
                    <>
                      <Button
                        label="Create Account"
                        onPress={handlePasskeySignUp}
                        disabled={!name.trim()}
                        testID="passkey-signup-button"
                      />
                      <View style={styles.buttonSpacer} />
                      <Button
                        label="Log In"
                        onPress={handlePasskeyLogin}
                        testID="passkey-login-button"
                      />
                    </>
                  )}

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <Pressable
                    onPress={() => {
                      setAuthMode("passphrase");
                      setStep("choose");
                    }}
                  >
                    <Text style={styles.linkText}>
                      Use recovery passphrase instead
                    </Text>
                  </Pressable>
                </View>
              ) : (
                // Dev mode or passphrase fallback: Show passphrase options
                <View style={styles.buttonGroup}>
                  <Button
                    label="Create Account"
                    onPress={() => setStep("create")}
                    testID="create-account-button"
                  />
                  <View style={styles.buttonSpacer} />
                  <Button
                    label="Log In"
                    onPress={() => setStep("login")}
                    testID="login-button"
                  />

                  {!isDev && (
                    <>
                      <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                      </View>

                      <Pressable onPress={() => setAuthMode("initial")}>
                        <Text style={styles.linkText}>
                          Use FaceID/TouchID instead
                        </Text>
                      </Pressable>
                    </>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Create account with passphrase */}
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
                devices or recover your account.
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
                <Button label="Generate New" onPress={handleReroll} />
                <View style={styles.buttonSpacer} />
                <Button label="Copy" onPress={handleCopyPassphrase} />
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
                <Button label="Back" onPress={handleBack} />
                <View style={styles.buttonSpacer} />
                {isLoading ? (
                  <ActivityIndicator />
                ) : (
                  <Button
                    label="Create Account"
                    onPress={handlePassphraseRegister}
                    disabled={!confirmSaved || !name.trim()}
                  />
                )}
              </View>
            </View>
          )}

          {/* Login with passphrase */}
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
                <Button label="Back" onPress={handleBack} />
                <View style={styles.buttonSpacer} />
                {isLoading ? (
                  <ActivityIndicator />
                ) : (
                  <Button
                    label="Log In"
                    onPress={handlePassphraseLogin}
                    testID="login-submit-button"
                  />
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Recovery Phrase Onboarding Screen
 *
 * Shown after passkey signup to ensure users save their recovery phrase.
 * This is critical for account recovery if they lose access to their device.
 */
function RecoveryPhraseOnboarding({
  onComplete,
  passphraseAuth,
}: {
  onComplete: () => void;
  passphraseAuth: ReturnType<typeof usePassphraseAuth>;
}) {
  const me = useAccount(PlayerAccount, {
    resolve: { root: { settings: true } },
  });
  const [confirmSaved, setConfirmSaved] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const passphrase = passphraseAuth.passphrase;

  const handleCopy = () => {
    if (!passphrase) return;
    Clipboard.setString(passphrase);
    Alert.alert("Copied", "Now save it somewhere safe (not on this device)!");
  };

  const handleContinue = () => {
    // Save confirmation to Jazz (syncs across devices)
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
    onComplete();
  };

  const handleSkip = () => {
    // Don't save the flag - they'll see a reminder on Profile tab
    onComplete();
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.content}>
            <Text style={styles.title}>Save Your Recovery Phrase</Text>

            <Text style={styles.description}>
              This phrase is the only way to recover your account if you lose
              access to this device. Save it somewhere safe.
            </Text>

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Do NOT save this on your phone. Use a password manager, write it
                down, or save it on another device.
              </Text>
            </View>

            <Pressable
              style={styles.passphraseBox}
              onPress={() => setIsVisible(!isVisible)}
            >
              {isVisible && passphrase ? (
                <Text style={styles.passphraseText}>{passphrase}</Text>
              ) : (
                <Text style={styles.passphraseHidden}>
                  Tap to reveal your recovery phrase
                </Text>
              )}
            </Pressable>

            {isVisible && (
              <View style={styles.buttonRow}>
                <Button label="Copy" onPress={handleCopy} />
              </View>
            )}

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
                I have saved my recovery phrase somewhere other than this device
              </Text>
            </Pressable>

            <View style={styles.buttonGroup}>
              <Button
                label="Continue"
                onPress={handleContinue}
                disabled={!confirmSaved}
              />
              <View style={styles.buttonSpacer} />
              <Pressable onPress={handleSkip}>
                <Text style={styles.linkText}>Skip for now</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create((theme) => ({
  keyboardAvoid: {
    flex: 1,
  },
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
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    paddingHorizontal: 12,
    color: theme.colors.secondary,
    fontSize: 14,
  },
  linkText: {
    textAlign: "center",
    color: theme.colors.action,
    fontSize: 14,
    textDecorationLine: "underline",
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
  warningBox: {
    backgroundColor: `${theme.colors.error}20`,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  warningText: {
    fontSize: 14,
    color: theme.colors.error,
    fontWeight: "600",
    textAlign: "center",
  },
  passphraseBox: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 100,
    justifyContent: "center",
  },
  passphraseText: {
    fontSize: 14,
    fontFamily: "monospace",
    color: theme.colors.primary,
    lineHeight: 22,
  },
  passphraseHidden: {
    fontSize: 14,
    color: theme.colors.secondary,
    textAlign: "center",
    fontStyle: "italic",
  },
}));
