import type { MaybeLoaded } from "jazz-tools";
import { useAccount } from "jazz-tools/react";
import { Play } from "lucide-react";
import { useCallback, useState } from "react";
import {
  FavoritePlayer,
  ListOfFavoritePlayers,
  type Player,
  PlayerAccount,
} from "spicylib/schema";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useToast } from "../components/ui/use-toast";

const CUTOFF_DATE = new Date("2026-02-13");
const EXCLUDED_GAME_NAME = "Big Game Test - 48";

export function BackfillPlayerRecents() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{
    gamesProcessed: number;
    playersAdded: number;
    playersUpdated: number;
  } | null>(null);

  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        games: {
          $each: {
            players: { $each: true },
          },
        },
        favorites: {
          recentPlayers: { $each: { player: true } },
        },
      },
    },
  });

  const handleBackfill = useCallback(async () => {
    if (
      !me?.$isLoaded ||
      !me.root?.$isLoaded ||
      !me.root.games?.$isLoaded ||
      !me.root.favorites?.$isLoaded
    ) {
      toast({
        variant: "destructive",
        title: "Not ready",
        description: "Account data not loaded yet",
      });
      return;
    }

    setIsRunning(true);
    setResult(null);

    const favorites = me.root.favorites;

    // Initialize recentPlayers list if needed
    if (!favorites.$jazz.has("recentPlayers")) {
      favorites.$jazz.set(
        "recentPlayers",
        ListOfFavoritePlayers.create([], { owner: favorites.$jazz.owner }),
      );
    }

    const recentPlayers = favorites.recentPlayers;
    if (!recentPlayers?.$isLoaded) {
      setIsRunning(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load recentPlayers list",
      });
      return;
    }

    // Build map of player ID -> most recent game date
    const playerLastUsed = new Map<string, Date>();
    let gamesProcessed = 0;
    const games = [...me.root.games];

    for (const game of games) {
      if (!game?.$isLoaded) continue;
      if (!game.start || game.start < CUTOFF_DATE) continue;
      if (game.name === EXCLUDED_GAME_NAME) continue;
      if (!game.players?.$isLoaded) continue;

      gamesProcessed++;

      for (const player of [...game.players]) {
        if (!player?.$isLoaded) continue;
        const id = player.$jazz.id;
        const existing = playerLastUsed.get(id);
        if (!existing || game.start > existing) {
          playerLastUsed.set(id, game.start);
        }
      }
    }

    // Upsert into recentPlayers
    let playersAdded = 0;
    let playersUpdated = 0;

    for (const [playerId, lastUsedAt] of playerLastUsed) {
      const existing = recentPlayers.find(
        (fp) =>
          fp?.$isLoaded &&
          fp.player?.$isLoaded &&
          fp.player.$jazz.id === playerId,
      );

      if (existing?.$isLoaded) {
        if (!existing.lastUsedAt || lastUsedAt > existing.lastUsedAt) {
          existing.$jazz.set("lastUsedAt", lastUsedAt);
          playersUpdated++;
        }
      } else {
        // Find the player reference from any game
        let playerRef: Player | null = null;
        for (const game of games) {
          if (!game?.$isLoaded || !game.players?.$isLoaded) continue;
          const found = [...game.players].find(
            (p: MaybeLoaded<Player>) => p?.$isLoaded && p.$jazz.id === playerId,
          );
          if (found?.$isLoaded) {
            playerRef = found;
            break;
          }
        }

        if (playerRef) {
          recentPlayers.$jazz.push(
            FavoritePlayer.create(
              {
                player: playerRef,
                addedAt: new Date(),
                lastUsedAt,
              },
              { owner: recentPlayers.$jazz.owner },
            ),
          );
          playersAdded++;
        }
      }
    }

    const stats = { gamesProcessed, playersAdded, playersUpdated };
    setResult(stats);
    setIsRunning(false);

    toast({
      title: "Backfill complete",
      description: `${gamesProcessed} games, ${playersAdded} added, ${playersUpdated} updated`,
    });
  }, [me, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backfill Player Recents</CardTitle>
        <CardDescription>
          Populate the recent players list from games since 2/13/26 (excludes "
          {EXCLUDED_GAME_NAME}")
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleBackfill} disabled={isRunning}>
          <Play className="mr-2 h-4 w-4" />
          {isRunning ? "Running..." : "Run Backfill"}
        </Button>

        {result && (
          <div className="rounded-md border p-4 text-sm">
            <p>
              <strong>Games processed:</strong> {result.gamesProcessed}
            </p>
            <p>
              <strong>Players added:</strong> {result.playersAdded}
            </p>
            <p>
              <strong>Players updated:</strong> {result.playersUpdated}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
