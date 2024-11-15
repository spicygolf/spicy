import { useContext } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import GamePlayersList from "@/components/GamePlayersList";
import { GameContext } from "@/providers/game";
import { Group } from "jazz-tools";
import { useAccount } from "@/providers/jazz";
import { Player } from "@/schema/players";

function GameSettingsPlayers() {
  const { game } = useContext(GameContext);
  const { me } = useAccount();
  const players = [] //game?.players;

  const addPlayer = () => {
    const group = Group.create({ owner: me });
    group.addMember("everyone", "writer");
    const player = Player.create(
      { name: "Brad Anderson", short: "boorad" },
      { owner: group }
    );
    players.push(player);
  };

  return (
    <View>
      <TouchableOpacity
        onPress={addPlayer}
        className="bg-blue-500 p-4 rounded-md my-4 flex-row items-center justify-center"
      >
        <Text className="text-white font-semibold text-center">Add Player</Text>
      </TouchableOpacity>

      <GamePlayersList />
    </View>
  );
}

export default GameSettingsPlayers;
