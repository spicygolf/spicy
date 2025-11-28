import { useCoState } from "jazz-tools/react";
import { Loader2 } from "lucide-react";
import type { Player, PlayerAccountProfile } from "spicylib/schema";
import { PlayerAccount } from "spicylib/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PlayerBrowserProps {
  workerAccountId: string;
}

export function PlayerBrowser({
  workerAccountId,
}: PlayerBrowserProps): React.JSX.Element {
  const workerAccount = useCoState(PlayerAccount, workerAccountId, {
    resolve: {
      profile: {
        catalog: {
          players: true,
        },
      },
    },
    select: (account) => {
      if (!account?.$isLoaded) return undefined;
      if (!account.profile?.$isLoaded) return undefined;

      const profile = account.profile as PlayerAccountProfile;
      const catalog = profile.catalog;
      if (!catalog?.$isLoaded) return undefined;

      // Players field is optional - if it exists, wait for it to load
      // If it doesn't exist, we can still render (will show empty state)
      if (catalog.$jazz.has("players") && !catalog.players?.$isLoaded) {
        return undefined;
      }

      return account;
    },
  });

  const players: Player[] = [];

  if (workerAccount?.profile) {
    const profile = workerAccount.profile as PlayerAccountProfile;
    const catalog = profile.catalog;

    if (catalog?.$isLoaded && catalog.players?.$isLoaded) {
      const catalogPlayers = catalog.players;
      for (const key of Object.keys(catalogPlayers)) {
        if (key.startsWith("_") || key.startsWith("$")) continue;
        const player = catalogPlayers[key as keyof typeof catalogPlayers];
        if (
          player &&
          typeof player === "object" &&
          "$jazz" in player &&
          player.$isLoaded
        ) {
          players.push(player as Player);
        }
      }
    }
  }

  if (workerAccount === null) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Worker account not found or not accessible
        </p>
      </div>
    );
  }

  if (workerAccount === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading players...</span>
      </div>
    );
  }

  const profile = workerAccount.profile as PlayerAccountProfile;
  const catalog = profile.catalog;
  if (!catalog) {
    return (
      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          No catalog found - migration may not have run
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          {players.length} players imported
        </p>
      </div>

      {players.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No players imported yet. Import players to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>GHIN ID</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Handicap</TableHead>
                <TableHead>Clubs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player.$jazz.id}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell>{player.ghinId || "N/A"}</TableCell>
                  <TableCell>{player.gender}</TableCell>
                  <TableCell>
                    {player.handicap?.$isLoaded
                      ? player.handicap.display || "N/A"
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {player.clubs?.$isLoaded && player.clubs.length > 0
                      ? player.clubs
                          .map((club) =>
                            club?.$isLoaded
                              ? club.state
                                ? `${club.name}, ${club.state}`
                                : club.name
                              : "",
                          )
                          .filter(Boolean)
                          .join(" • ")
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
