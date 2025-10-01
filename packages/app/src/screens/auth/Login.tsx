import { useNavigation } from "@react-navigation/native";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { Button, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { betterAuthClient } from "@/lib/auth-client";
import type { AuthStackNavigationProp } from "@/navigators/AuthNavigator";
import { Screen, Text } from "@/ui";
import { Input } from "@/ui/Input";

interface LoginForm {
  email: string;
  password: string;
}

export function Login() {
  const { control, handleSubmit } = useForm<LoginForm>();
  const navigation = useNavigation<AuthStackNavigationProp>();

  const onSubmit: SubmitHandler<LoginForm> = async ({ email, password }) => {
    await betterAuthClient.signIn.email(
      { email, password },
      {
        onSuccess: async () => {
          console.log("Sign in successful");
        },
        onError: (e: unknown) => {
          console.error("Sign in error:", e);
        },
      },
    );
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Sign In</Text>
        <Input<LoginForm>
          control={control}
          name="email"
          label="Email Address"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input<LoginForm>
          control={control}
          label="Password"
          name="password"
          secureTextEntry
        />
        <Button title="Sign In" onPress={handleSubmit(onSubmit)} />
        <View style={styles.register_view}>
          <Text style={styles.register_label}>Don't have an account?</Text>
          <Button
            onPress={() => {
              navigation.replace("Register");
            }}
            title="Sign Up"
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  register_view: {
    alignItems: "center",
    marginTop: 25,
  },
  register_label: {
    color: theme.colors.secondary,
  },
}));
