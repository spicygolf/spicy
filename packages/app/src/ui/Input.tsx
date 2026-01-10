/**
 * Form Input component with label and validation support
 *
 * Use this for form-controlled inputs with labels and react-hook-form.
 * For simple styled text inputs, use TextInput from @/ui instead.
 */

import { useState } from "react";
import type {
  Control,
  FieldValues,
  Path,
  RegisterOptions,
} from "react-hook-form";
import { useController } from "react-hook-form";
import type { TextInputProps as RNTextInputProps } from "react-native";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text, TextInput } from "@/ui";

interface InputProps<F extends FieldValues> extends RNTextInputProps {
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
  extends Omit<RNTextInputProps, "value" | "onChangeText"> {
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

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          value={field.value || ""}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          hasError={!!error}
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

  const handleChangeText = (text: string) => {
    setInternalValue(text);
    onChangeText?.(text);
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          value={value !== undefined ? value : internalValue}
          onChangeText={handleChangeText}
          hasError={!!error}
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
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 3,
  },
}));
