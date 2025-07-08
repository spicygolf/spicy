import React, { useState } from 'react';
import { Button, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from 'jazz-react-auth-betterauth';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { StyleSheet } from 'react-native-unistyles';
import type { AuthStackNavigationProp } from '@/navigators/AuthNavigator';
import { Screen, Text } from '@/ui';
import { Input } from '@/ui/Input';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
}

interface VerifyForm {
  code: string;
}

export function Register() {
  const auth = useAuth();
  const [pendingVerification, _setPendingVerification] = useState(false);
  const [errorMessage, _setErrorMessage] = React.useState('');
  const { control, handleSubmit, watch } = useForm<RegisterForm>();
  const { control: controlVerify, handleSubmit: handleSubmitVerify } =
    useForm<VerifyForm>();
  const password = watch('password');
  const navigation = useNavigation<AuthStackNavigationProp>();

  const onSignupPress: SubmitHandler<RegisterForm> = async data => {
    await auth.authClient.signUp.email(
      {
        email: data.email,
        password: data.password,
        name: data.email,
      },
      {
        onSuccess: async () => {
          await auth.signIn();
          // TODO: check that isAuthenticated routes to <AppNavigator />
          // navigation.replace("Games");
        },
        onError: (e: unknown) => {
          console.log('onSignupPress error', e);
          const error = e as Error;
          console.log(error.stack);
          console.error('Sign up error', {
            description: error.message,
          });
        },
      },
    );

    //   if (!isLoaded) return;
    //   try {
    //     const res1 = await signUp.create({
    //       emailAddress: data.email,
    //       password: data.password,
    //     });
    //     console.log('res1', res1);
    //     const res2 = await signUp.prepareEmailAddressVerification({
    //       strategy: 'email_code',
    //     });
    //     console.log('res2', res2);
    //     setPendingVerification(true);
    //   } catch (e: unknown) {
    //     const err = e as Error;
    //     // console.error(err.stack);
    //     console.error(JSON.stringify(err, null, 2));
    //     if (err.message) {
    //       setErrorMessage(err.message);
    //     } else {
    //       setErrorMessage('An unexpected error occurred. Please try again.');
    //     }
    //   }
  };

  const onVerifyPress: SubmitHandler<VerifyForm> = async _data => {
    // if (!isLoaded) return;
    // setErrorMessage('');
    // try {
    //   const completeSignUp = await signUp.attemptEmailAddressVerification({
    //     code: data.code,
    //   });
    //   if (completeSignUp.status === 'complete') {
    //     await setActive({ session: completeSignUp.createdSessionId });
    //   } else {
    //     console.error(JSON.stringify(completeSignUp, null, 2));
    //     setErrorMessage('Failed to verify. Please check your code.');
    //   }
    // } catch (e: unknown) {
    //   const err = e as Error;
    //   console.error(JSON.stringify(err, null, 2));
    //   setErrorMessage('Invalid verification code. Please try again.');
    // }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>
          {pendingVerification ? 'Verify Email' : 'Sign Up'}
        </Text>

        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.error}>{errorMessage}</Text>
          </View>
        )}

        {!pendingVerification && (
          <View>
            <Input<RegisterForm>
              control={control}
              name="email"
              label="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              }}
            />
            <Input<RegisterForm>
              control={control}
              label="Password"
              name="password"
              secureTextEntry
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              }}
            />
            <Input<RegisterForm>
              control={control}
              label="Confirm Password"
              name="confirmPassword"
              secureTextEntry
              rules={{
                required: 'Please confirm your password',
                validate: value =>
                  value === password || 'The passwords do not match',
              }}
            />
            <Button title="Sign Up" onPress={handleSubmit(onSignupPress)} />
            <View style={styles.login_view}>
              <Text style={styles.login_label}>Already have an account?</Text>
              <Button
                onPress={() => {
                  navigation.replace('Login');
                }}
                title="Sign In"
              />
            </View>
          </View>
        )}

        {pendingVerification && (
          <View style={styles.container}>
            <Text style={styles.title}>Verify Email</Text>
            <Input<VerifyForm>
              control={controlVerify}
              name="code"
              label="Code"
              keyboardType="phone-pad"
            />
            <Button
              title="Verify"
              onPress={handleSubmitVerify(onVerifyPress)}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  login_view: {
    alignItems: 'center',
    marginTop: 25,
  },
  login_label: {
    color: theme.colors.secondary,
  },
  errorContainer: {
    paddingVertical: 10,
  },
  error: {
    color: 'red',
  },
}));
