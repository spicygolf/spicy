import type {
  Control,
  FieldValues,
  Path,
  RegisterOptions,
} from "react-hook-form";
import { useController } from "react-hook-form";
import type { TextInputProps } from "react-native";
// biome-ignore lint/style/noRestrictedImports: This component is a wrapper around the React Native component.
import { TextInput, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "@/ui";

interface InputProps<F extends FieldValues> extends TextInputProps {
  name: Path<F>;
  label: string;
  control: Control<F>;
  rules?: Omit<
    RegisterOptions<F, Path<F>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
}

export function Input<F extends FieldValues>({
  name,
  label,
  control,
  rules,
  ...rest
}: InputProps<F>) {
  const {
    field,
    fieldState: { error },
  } = useController({ name, control, rules });
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          {...rest}
        />
        {error?.message ? (
          <Text style={styles.errorText}>{error.message}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  label: {
    fontWeight: "bold",
    marginBottom: 3,
  },
  inputContainer: {
    marginBottom: 10,
  },
  input: {
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: theme.colors.secondary,
    padding: 8,
    color: theme.colors.primary,
  },
  inputError: {
    borderColor: "#dc3545",
  },
  errorText: {
    color: "#dc3545",
    fontSize: 12,
    marginTop: 3,
  },
}));
