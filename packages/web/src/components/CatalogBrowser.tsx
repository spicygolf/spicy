import { useCoState } from "jazz-tools/react";
import { Loader2, RefreshCw } from "lucide-react";
import type {
  GameOption,
  GameSpec,
  JunkOption,
  MultiplierOption,
  Option,
  PlayerAccountProfile,
} from "spicylib/schema";
import { PlayerAccount } from "spicylib/schema";
import { getSpecField } from "spicylib/scoring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CatalogBrowserProps {
  workerAccountId: string;
}

export function CatalogBrowser({
  workerAccountId,
}: CatalogBrowserProps): React.JSX.Element {
  // Use Jazz's reactive loading with selector to control when data is ready
  const workerAccount = useCoState(PlayerAccount, workerAccountId, {
    resolve: {
      profile: {
        catalog: {
          specs: true, // Load the specs map shallowly
          options: true, // Load the unified options map
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

      // Options field is optional - if it exists, wait for it to load
      if (catalog.$jazz.has("options") && !catalog.options?.$isLoaded) {
        return undefined;
      }

      return account;
    },
  });

  // Extract specs and options from the loaded account
  const specs: GameSpec[] = [];
  const gameOptions: GameOption[] = [];
  const junkOptions: JunkOption[] = [];
  const multiplierOptions: MultiplierOption[] = [];

  if (workerAccount?.profile) {
    const profile = workerAccount.profile as PlayerAccountProfile;
    const catalog = profile.catalog;

    if (catalog?.$isLoaded) {
      // Extract specs
      if (catalog.specs?.$isLoaded) {
        const catalogSpecs = catalog.specs;
        for (const key of Object.keys(catalogSpecs)) {
          if (key.startsWith("_") || key.startsWith("$")) continue;
          const spec = catalogSpecs[key as keyof typeof catalogSpecs];
          if (
            spec &&
            typeof spec === "object" &&
            "$jazz" in spec &&
            spec.$isLoaded
          ) {
            specs.push(spec as GameSpec);
          }
        }
      }

      // Extract options from unified map
      if (catalog.options?.$isLoaded) {
        const catalogOptions = catalog.options;
        for (const key of Object.keys(catalogOptions)) {
          if (key.startsWith("_") || key.startsWith("$")) continue;
          const opt = catalogOptions[key as keyof typeof catalogOptions];
          if (
            opt &&
            typeof opt === "object" &&
            "$jazz" in opt &&
            opt.$isLoaded
          ) {
            const option = opt as Option;
            // Filter by type into separate arrays
            if (option.type === "game") {
              gameOptions.push(option as GameOption);
            } else if (option.type === "junk") {
              junkOptions.push(option as JunkOption);
            } else if (option.type === "multiplier") {
              multiplierOptions.push(option as MultiplierOption);
            }
          }
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
        <span className="ml-2 text-muted-foreground">Loading catalog...</span>
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Game Catalog</h3>
          <p className="text-sm text-muted-foreground">
            {specs.length} specs, {gameOptions.length} game options,{" "}
            {junkOptions.length} junk, {multiplierOptions.length} multipliers
          </p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="specs" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="specs">Specs ({specs.length})</TabsTrigger>
          <TabsTrigger value="game">
            Game Options ({gameOptions.length})
          </TabsTrigger>
          <TabsTrigger value="junk">Junk ({junkOptions.length})</TabsTrigger>
          <TabsTrigger value="multipliers">
            Multipliers ({multiplierOptions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="specs">
          {specs.length === 0 ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No game specs in catalog yet. Import some specs to get started.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Short Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Players</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specs.map((spec) => {
                    const name = getSpecField(spec, "name") as string;
                    const short = getSpecField(spec, "short") as string;
                    const version = getSpecField(spec, "version") as number;
                    const specType = getSpecField(spec, "spec_type") as string;
                    const status = getSpecField(spec, "status") as string;
                    const minPlayers = getSpecField(
                      spec,
                      "min_players",
                    ) as number;
                    const locationType = getSpecField(
                      spec,
                      "location_type",
                    ) as string;

                    return (
                      <TableRow key={spec.$jazz.id}>
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell>{short}</TableCell>
                        <TableCell>{version}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{specType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              status === "prod"
                                ? "default"
                                : status === "dev"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell>{minPlayers || "N/A"}</TableCell>
                        <TableCell>{locationType || "N/A"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="game">
          {gameOptions.length === 0 ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No game options imported yet.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Display</TableHead>
                    <TableHead>Value Type</TableHead>
                    <TableHead>Default</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gameOptions.map((opt) => (
                    <TableRow key={opt.$jazz.id}>
                      <TableCell className="font-medium">{opt.name}</TableCell>
                      <TableCell>{opt.disp}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{opt.valueType}</Badge>
                      </TableCell>
                      <TableCell>{opt.defaultValue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="junk">
          {junkOptions.length === 0 ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No junk options imported yet.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Display</TableHead>
                    <TableHead>Sub Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Based On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {junkOptions.map((opt) => (
                    <TableRow key={opt.$jazz.id}>
                      <TableCell className="font-medium">{opt.name}</TableCell>
                      <TableCell>{opt.disp}</TableCell>
                      <TableCell>
                        {opt.sub_type && (
                          <Badge variant="outline">{opt.sub_type}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{opt.value}</TableCell>
                      <TableCell>{opt.scope || "N/A"}</TableCell>
                      <TableCell>{opt.based_on || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="multipliers">
          {multiplierOptions.length === 0 ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No multiplier options imported yet.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Display</TableHead>
                    <TableHead>Sub Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Based On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {multiplierOptions.map((opt) => (
                    <TableRow key={opt.$jazz.id}>
                      <TableCell className="font-medium">{opt.name}</TableCell>
                      <TableCell>{opt.disp}</TableCell>
                      <TableCell>
                        {opt.sub_type && (
                          <Badge variant="outline">{opt.sub_type}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{opt.value}x</TableCell>
                      <TableCell>{opt.scope || "N/A"}</TableCell>
                      <TableCell>{opt.based_on || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
