import type { FontAwesome6SolidIconName } from "@react-native-vector-icons/fontawesome6";
import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useState } from "react";
import { TouchableOpacity, View, type ViewStyle } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "./Text";

interface ButtonGroupProps {
  buttons: {
    label?: string;
    iconName?: FontAwesome6SolidIconName;
    onPress: () => void;
  }[];
  selectedIndex?: number;
  containerStyle?: ViewStyle;
}

export function ButtonGroup({
  buttons,
  selectedIndex,
  containerStyle,
}: ButtonGroupProps) {
  const [selected, setSelected] = useState(selectedIndex ?? 0);
  const { theme } = useUnistyles();

  return (
    <View style={[styles.container, containerStyle]}>
      {buttons.map((button, index) => {
        const isSelected = selected === index;
        return (
          <TouchableOpacity
            key={button.label}
            onPress={() => {
              setSelected(index);
              button.onPress();
            }}
            style={[styles.button, isSelected && styles.selected]}
          >
            {button.iconName && (
              <FontAwesome6
                name={button.iconName}
                size={18}
                color={
                  isSelected ? theme.colors.background : theme.colors.primary
                }
                iconStyle="solid"
              />
            )}
            {button.label && (
              <Text
                style={
                  isSelected
                    ? { ...styles.label, ...styles.selectedText }
                    : styles.label
                }
              >
                {button.label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    width: "100%",
    alignItems: "stretch",
    borderWidth: 0.5,
    borderColor: theme.colors.primary,
    borderRadius: theme.gap(0.75),
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.gap(0.75),
    padding: theme.gap(0.75),
    minWidth: 0,
    flexBasis: 0,
  },
  selected: {
    backgroundColor: theme.colors.primary,
  },
  label: {
    color: theme.colors.primary,
    paddingHorizontal: theme.gap(1),
    textAlign: "center",
    flexShrink: 1,
    flexGrow: 0,
    numberOfLines: 1,
    ellipsizeMode: "tail",
  },
  selectedText: {
    color: theme.colors.background,
  },
}));
