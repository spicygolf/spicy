import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface FavoriteButtonProps {
  isFavorited: boolean;
  onToggle: (newState: boolean) => void;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
  disabled?: boolean;
}

export function FavoriteButton({
  isFavorited,
  onToggle,
  size = 24,
  activeColor = "#FFD700",
  inactiveColor = "#808080",
  disabled = false,
}: FavoriteButtonProps) {
  const handlePress = () => {
    if (!disabled) {
      onToggle(!isFavorited);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={styles.button}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <FontAwesome6
        name="star"
        iconStyle={isFavorited ? "solid" : "regular"}
        size={size}
        color={isFavorited ? activeColor : inactiveColor}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    paddingVertical: theme.gap(0.5),
    paddingRight: theme.gap(0.5),
  },
}));
