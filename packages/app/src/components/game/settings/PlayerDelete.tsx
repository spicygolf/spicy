import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { TouchableOpacity } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import type { Player } from "spicylib/schema";

interface PlayerDeleteProps {
  player: Player;
  onDelete: (player: Player) => void;
}

export function PlayerDelete({ player, onDelete }: PlayerDeleteProps) {
  const { theme } = useUnistyles();

  return (
    <TouchableOpacity onPress={() => onDelete(player)}>
      <FontAwesome6
        name="delete-left"
        size={18}
        color={theme.colors.secondary}
        iconStyle="solid"
      />
    </TouchableOpacity>
  );
}
