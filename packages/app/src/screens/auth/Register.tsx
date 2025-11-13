import { useNavigation } from "@react-navigation/native";
import { useAccount } from "jazz-tools/react-native";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { Button, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PlayerAccount } from "spicylib/schema";
import { betterAuthClient } from "@/lib/auth-client";
import type { AuthStackNavigationProp } from "@/navigators/AuthNavigator";
import { Screen, Text } from "@/ui";
import { Input } from "@/ui/Input";

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

export function Register() {
  const me = useAccount(PlayerAccount, {
    select: (me) =>
      me.$isLoaded
        ? me
        : me.$jazz.loadingState === "loading"
          ? undefined
          : null,
  });
  const { control, handleSubmit, watch } = useForm<RegisterForm>();
  const password = watch("password");
  const navigation = useNavigation<AuthStackNavigationProp>();

  const onSubmit: SubmitHandler<RegisterForm> = async ({
    email,
    password,
    name,
  }) => {
    await betterAuthClient.signUp.email(
      {
        email,
        password,
        name,
      },
      {
        onSuccess: async () => {
          if (me?.$isLoaded && me.profile?.$isLoaded) {
            me.profile.$jazz.set("name", name);
          }
          console.log("Registration successful");
        },
        onError: (error: unknown) => {
          console.error("Registration error:", error);
        },
      },
    );
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>

        <Input<RegisterForm>
          control={control}
          name="name"
          label="Full Name"
          autoCapitalize="words"
          rules={{ required: "Name is required" }}
        />

        <Input<RegisterForm>
          control={control}
          name="email"
          label="Email Address"
          keyboardType="email-address"
          autoCapitalize="none"
          rules={{
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+$/i,
              message: "Invalid email address",
            },
          }}
        />

        <Input<RegisterForm>
          control={control}
          name="password"
          label="Password"
          secureTextEntry
          rules={{
            required: "Password is required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters",
            },
          }}
        />

        <Input<RegisterForm>
          control={control}
          name="confirmPassword"
          label="Confirm Password"
          secureTextEntry
          rules={{
            required: "Please confirm your password",
            validate: (value) => value === password || "Passwords don't match",
          }}
        />

        <Button title="Create Account" onPress={handleSubmit(onSubmit)} />

        <View style={styles.signin_view}>
          <Text style={styles.signin_label}>Already have an account?</Text>
          <Button onPress={() => navigation.replace("Login")} title="Sign In" />
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
  signin_view: {
    alignItems: "center",
    marginTop: 25,
  },
  signin_label: {
    color: theme.colors.secondary,
  },
}));
