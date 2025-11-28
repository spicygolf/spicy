import { useCoState } from "jazz-tools/react";
import { Loader2, RefreshCw } from "lucide-react";
import type { GameSpec, PlayerAccountProfile } from "spicylib/schema";
import { PlayerAccount } from "spicylib/schema";
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

  // Extract specs directly from the loaded account
  const specs: GameSpec[] = [];
  if (workerAccount?.profile) {
    const profile = workerAccount.profile as PlayerAccountProfile;
    const catalog = profile.catalog;
    if (catalog?.$isLoaded && catalog.specs?.$isLoaded) {
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
          <h3 className="text-lg font-semibold">
            Game Catalog ({specs.length} specs)
          </h3>
          <p className="text-sm text-muted-foreground">
            Shared game specifications available to all users
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
              {specs.map((spec) => (
                <TableRow key={spec.$jazz.id}>
                  <TableCell className="font-medium">{spec.name}</TableCell>
                  <TableCell>{spec.short}</TableCell>
                  <TableCell>{spec.version}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{spec.spec_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        spec.status === "prod"
                          ? "default"
                          : spec.status === "dev"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {spec.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{spec.min_players || "N/A"}</TableCell>
                  <TableCell>{spec.location_type || "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
