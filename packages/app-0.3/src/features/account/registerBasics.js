import { useNavigation } from "@react-navigation/native";
import { validateEmail, validatePassword } from "common/utils/account";
import BackToLogin from "features/account/backToLogin";
import { RegisterContext } from "features/account/registerContext";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Card, Input } from "react-native-elements";

const RegisterBasics = (_props) => {
  const { registration, setRegistration } = useContext(RegisterContext);
  const navigation = useNavigation();
  const emailRef = useRef(null);

  const [emailValid, setEmailValid] = useState(false);
  const [passValid, setPassValid] = useState(false);
  const [pass2Valid, setPass2Valid] = useState(false);

  const validate = useCallback(
    (type, text) => {
      const eTest = type === "email" ? text : registration.email;
      const pTest = type === "password" ? text : registration.password;
      const p2Test = type === "password2" ? text : registration.password2;

      setEmailValid(validateEmail(eTest));
      setPassValid(validatePassword(pTest) && pTest === p2Test);
      setPass2Valid(validatePassword(p2Test) && p2Test === pTest);
    },
    [registration.email, registration.password, registration.password2],
  );

  useEffect(() => {
    if (emailRef?.current) {
      // emailRef.current.focus();
      validate();
    }
  }, [emailRef, validate]);

  return (
    <View style={styles.container}>
      <BackToLogin />
      <KeyboardAvoidingView>
        <ScrollView keyboardShouldPersistTaps="handled">
          <Card>
            <Card.Title>Register - Basics</Card.Title>
            <Card.Divider />
            <View>
              <View style={styles.field}>
                <Input
                  label="Email"
                  labelStyle={styles.label}
                  containerStyle={styles.field_input}
                  inputStyle={styles.field_input_txt}
                  errorMessage={
                    emailValid ? "" : "Please enter a valid email address"
                  }
                  onChangeText={(text) => {
                    setRegistration({
                      ...registration,
                      email: text,
                    });
                    validate("email", text);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={registration.email}
                  ref={emailRef}
                />
              </View>
              <View style={styles.field}>
                <Input
                  label="Password"
                  labelStyle={styles.label}
                  containerStyle={styles.field_input}
                  inputStyle={styles.field_input_txt}
                  errorMessage={
                    passValid
                      ? ""
                      : "Please enter a valid and matching password (4+ characters)"
                  }
                  onChangeText={(text) => {
                    setRegistration({
                      ...registration,
                      password: text,
                    });
                    validate("password", text);
                  }}
                  autoCompleteType="password"
                  secureTextEntry={true}
                  autoCapitalize="none"
                  value={registration.password}
                />
              </View>
              <View style={styles.field}>
                <Input
                  label="Password Again"
                  labelStyle={styles.label}
                  containerStyle={styles.field_input}
                  inputStyle={styles.field_input_txt}
                  errorMessage={
                    pass2Valid ? "" : "Please enter a matching password"
                  }
                  onChangeText={(text) => {
                    setRegistration({
                      ...registration,
                      password2: text,
                    });
                    validate("password2", text);
                  }}
                  autoCompleteType="password"
                  secureTextEntry={true}
                  autoCapitalize="none"
                  value={registration.password2}
                />
              </View>
            </View>
          </Card>
          <View style={styles.button_row}>
            <Button
              style={styles.next}
              title="Next"
              type={emailValid && passValid && pass2Valid ? "solid" : "outline"}
              disabled={!(emailValid && passValid && pass2Valid)}
              onPress={() => {
                navigation.navigate("RegisterHandicap");
              }}
              accessibilityLabel="Register Next 1"
              testID="register_next_1_button"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RegisterBasics;

const styles = StyleSheet.create({
  button_row: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 15,
  },
  container: {
    backgroundColor: "#b30000",
    flex: 1,
  },
  field: {
    flex: 1,
    marginBottom: 15,
  },
  field_input: {
    color: "#000",
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  label: {
    color: "#999",
    fontSize: 12,
    fontWeight: "normal",
  },
  login_button: {
    marginBottom: 15,
    marginTop: 15,
  },
  next: {
    width: 150,
  },
});
