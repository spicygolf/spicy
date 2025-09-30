import { Dropdown } from "react-native-element-dropdown";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export interface PickerItem {
  label: string;
  value: string;
}

interface PickerProps {
  title: string;
  items: PickerItem[];
  selectedValue: string | undefined;
  onValueChange: (value: string) => void;
}

export function Picker({
  title,
  items,
  selectedValue,
  onValueChange,
}: PickerProps) {
  const { theme } = useUnistyles();
  const onChange = (selection: PickerItem) => {
    onValueChange(selection.value);
  };

  return (
    <Dropdown
      value={selectedValue}
      data={items}
      labelField="label"
      valueField="value"
      onChange={onChange}
      style={styles.picker}
      placeholder={title}
      placeholderStyle={styles.placeholder}
      selectedTextStyle={styles.selectedText}
      itemContainerStyle={styles.itemContainer}
      itemTextStyle={styles.itemText}
      activeColor={theme.colors.action}
      // @ts-expect-error patched react-native-element-dropdown, but not types (I think)
      activeTextColor={theme.colors.actionText}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  picker: {
    borderRadius: theme.gap(0.75),
    borderWidth: 0.75,
    borderColor: theme.colors.secondary,
    padding: theme.gap(1),
  },
  placeholder: {
    color: theme.colors.secondary,
    fontSize: 12,
  },
  selectedText: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  itemContainer: {
    backgroundColor: theme.colors.background,
  },
  itemText: {
    color: theme.colors.primary,
    fontSize: 14,
  },
}));
