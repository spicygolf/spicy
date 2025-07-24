import type { Game, ListOfGames } from "@/schema/games";
import { Button } from "@/ui";

// TODO: will we be able to get `games` list to this component, if it's located
//       on the GameSettings screen?
export function GameDelete({
  games,
  game,
}: {
  games: ListOfGames;
  game: Game;
}) {
  const deleteGame = (id: string) => {
    const idx = games.findIndex((game) => game?.id === id);
    games.splice(idx, 1);
  };

  return <Button label="Delete Game" onPress={() => deleteGame(game.id)} />;
}
