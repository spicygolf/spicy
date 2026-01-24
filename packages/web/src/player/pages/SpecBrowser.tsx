import { useCoState } from "jazz-tools/react";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  type GameCatalog,
  type GameSpec,
  PlayerAccount,
  type PlayerAccountProfile,
} from "spicylib/schema";
import { getMetaOption, getSpecField } from "spicylib/scoring";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";

/**
 * SpecBrowser - Player-facing game spec browser with alias search
 *
 * Features:
 * - Search by name, short name, or aliases (e.g., "Scotch" finds "Five Points")
 * - Display spec metadata from meta options
 * - Links to spec details/editor (future)
 */
export function SpecBrowser(): React.JSX.Element {
  const [search, setSearch] = useState("");

  const workerAccountId = import.meta.env.VITE_JAZZ_WORKER_ACCOUNT || "";

  const workerAccount = useCoState(PlayerAccount, workerAccountId, {
    resolve: {
      profile: {
        catalog: {
          specs: { $each: { options: { $each: true } } },
        },
      },
    },
    select: (account) => {
      if (!account?.$isLoaded) return undefined;
      if (!account.profile?.$isLoaded) return undefined;

      const profile = account.profile as PlayerAccountProfile;
      const catalog = profile.catalog;
      if (!catalog?.$isLoaded) return undefined;
      if (!catalog.specs?.$isLoaded) return undefined;

      return account;
    },
  });

  const catalog = workerAccount
    ? ((workerAccount.profile as PlayerAccountProfile).catalog as GameCatalog)
    : undefined;
  const specs = catalog?.specs;

  // Filter specs based on search query
  const filteredSpecs = useMemo(() => {
    if (!specs?.$isLoaded) return [];

    const specList: { key: string; spec: GameSpec }[] = [];
    for (const key of Object.keys(specs)) {
      if (key.startsWith("$") || key === "_refs") continue;
      if (!specs.$jazz.has(key)) continue;
      const spec = specs[key];
      if (spec?.$isLoaded) {
        specList.push({ key, spec });
      }
    }

    if (!search.trim()) {
      return specList.sort((a, b) => a.spec.name.localeCompare(b.spec.name));
    }

    const searchLower = search.toLowerCase();

    return specList
      .filter(({ spec }) => {
        // Search by display name
        const name = spec.name.toLowerCase();
        if (name.includes(searchLower)) return true;

        // Search by short name (meta option)
        const short = getSpecField(spec, "short");
        if (
          typeof short === "string" &&
          short.toLowerCase().includes(searchLower)
        ) {
          return true;
        }

        // Search by aliases (meta option with searchable: true)
        const aliases = getMetaOption(spec, "aliases");
        if (Array.isArray(aliases)) {
          for (const alias of aliases) {
            if (
              typeof alias === "string" &&
              alias.toLowerCase().includes(searchLower)
            ) {
              return true;
            }
          }
        }

        return false;
      })
      .sort((a, b) => a.spec.name.localeCompare(b.spec.name));
  }, [specs, search]);

  // Loading state
  if (!workerAccount) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Game Specs</h1>
        <p className="text-muted-foreground">
          Browse available game types. Search by name or alias (e.g., try
          "Scotch" or "Chicago").
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search specs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Specs Grid */}
      {filteredSpecs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {search
              ? `No specs found for "${search}"`
              : "No game specs available"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSpecs.map(({ key, spec }) => (
            <SpecCard key={spec.$jazz.id} specKey={key} spec={spec} />
          ))}
        </div>
      )}
    </div>
  );
}

interface SpecCardProps {
  specKey: string;
  spec: GameSpec;
}

function SpecCard({ specKey, spec }: SpecCardProps): React.JSX.Element {
  const short = getSpecField(spec, "short");
  const aliases = getMetaOption(spec, "aliases");
  const specType = getSpecField(spec, "spec_type") ?? spec.spec_type;
  const minPlayers = getSpecField(spec, "min_players") ?? spec.min_players;
  const maxPlayers = getSpecField(spec, "max_players");
  const status = getSpecField(spec, "status") ?? spec.status;

  // Format player count
  const playerCount =
    minPlayers === maxPlayers
      ? `${minPlayers} players`
      : maxPlayers
        ? `${minPlayers}-${maxPlayers} players`
        : `${minPlayers}+ players`;

  return (
    <Link to={`/spec/${encodeURIComponent(specKey)}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{spec.name}</CardTitle>
              {short && (
                <p className="text-sm text-muted-foreground font-mono">
                  {short}
                </p>
              )}
            </div>
            {status === "dev" && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Dev
              </span>
            )}
          </div>
          {Array.isArray(aliases) && aliases.length > 0 && (
            <CardDescription>
              Also known as: {aliases.join(", ")}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="bg-muted px-2 py-1 rounded capitalize">
              {specType}
            </span>
            <span className="bg-muted px-2 py-1 rounded">{playerCount}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
