import { useState } from "react";
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
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "@/ui";

interface InputProps<F extends FieldValues> extends TextInputProps {
  name: Path<F>;
  label: string;
  control?: Control<F>;
  rules?: Omit<
    RegisterOptions<F, Path<F>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
}

// Standalone props for when not using react-hook-form
interface StandaloneInputProps
  extends Omit<TextInputProps, "value" | "onChangeText"> {
  label: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
}

// Union type for both use cases
type InputComponentProps<F extends FieldValues> =
  | InputProps<F>
  | StandaloneInputProps;

// Form-controlled version
function FormControlledInput<F extends FieldValues>({
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

  const { theme } = useUnistyles();

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={field.value || ""}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          placeholderTextColor={theme.colors.secondary}
          {...rest}
        />
        {error?.message ? (
          <Text style={styles.errorText}>{error.message}</Text>
        ) : null}
      </View>
    </View>
  );
}

// Standalone version
function StandaloneInput({
  label,
  value,
  onChangeText,
  error,
  ...rest
}: StandaloneInputProps) {
  const [internalValue, setInternalValue] = useState(value || "");
  const { theme } = useUnistyles();

  const handleChangeText = (text: string) => {
    setInternalValue(text);
    onChangeText?.(text);
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={value !== undefined ? value : internalValue}
          onChangeText={handleChangeText}
          placeholderTextColor={theme.colors.secondary}
          {...rest}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </View>
  );
}

export function Input<F extends FieldValues>(props: InputComponentProps<F>) {
  // Check if this is a form-controlled input
  const isFormControlled = "control" in props && "name" in props;

  if (isFormControlled) {
    return <FormControlledInput {...(props as InputProps<F>)} />;
  } else {
    return <StandaloneInput {...(props as StandaloneInputProps)} />;
  }
}

const styles = StyleSheet.create((theme) => ({
  label: {
    color: theme.colors.secondary,
    fontSize: 10,
    marginBottom: 3,
  },
  inputContainer: {
    marginBottom: 10,
  },
  input: {
    borderRadius: theme.gap(0.75),
    borderWidth: 0.75,
    borderColor: theme.colors.secondary,
    padding: theme.gap(1),
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
