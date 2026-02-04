import { useMemo } from "react";
import { Dropdown } from "react-native-element-dropdown";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export interface PickerItem {
  label: string;
  value: string;
}

interface PickerItemInternal extends PickerItem {
  testID: string;
}

interface PickerProps {
  title: string;
  items: PickerItem[];
  selectedValue: string | undefined;
  onValueChange: (value: string) => void;
  testID?: string;
}

/**
 * Dropdown picker component with E2E testID support.
 *
 * Each dropdown item gets a testID in the format: `{pickerTestID}-item-{value}`
 * For example, if testID="hole-6-par" and value="3", the item testID is "hole-6-par-item-3"
 */
export function Picker({
  title,
  items,
  selectedValue,
  onValueChange,
  testID,
}: PickerProps) {
  const { theme } = useUnistyles();
  const onChange = (selection: PickerItemInternal) => {
    onValueChange(selection.value);
  };

  // Add testID to each item for E2E testing
  const itemsWithTestID: PickerItemInternal[] = useMemo(() => {
    return items.map((item) => ({
      ...item,
      testID: testID
        ? `${testID}-item-${item.value}`
        : `picker-item-${item.value}`,
    }));
  }, [items, testID]);

  return (
    <Dropdown
      testID={testID}
      value={selectedValue}
      data={itemsWithTestID}
      labelField="label"
      valueField="value"
      itemTestIDField="testID"
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
