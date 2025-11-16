import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { Pressable } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface FavoriteButtonProps {
  isFavorited: boolean;
  onToggle: (newState: boolean) => void;
  size?: number;
  disabled?: boolean;
}

export function FavoriteButton({
  isFavorited,
  onToggle,
  size = 24,
  disabled = false,
}: FavoriteButtonProps) {
  const { theme } = useUnistyles();

  const handlePress = () => {
    if (!disabled) {
      onToggle(!isFavorited);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={stylesheet.button}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <FontAwesome6
        name="star"
        iconStyle={isFavorited ? "solid" : "regular"}
        size={size}
        color={
          isFavorited ? theme.colors.fave.active : theme.colors.fave.inactive
        }
      />
    </Pressable>
  );
}

const stylesheet = StyleSheet.create((theme) => ({
  button: {
    paddingVertical: theme.gap(0.5),
    paddingRight: theme.gap(0.5),
  },
}));
