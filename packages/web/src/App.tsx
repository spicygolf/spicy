import type { co } from "jazz-tools";
import { useAccount, useLogOut } from "jazz-tools/react";
import {
  BookOpen,
  Calculator,
  Download,
  LogOut,
  RefreshCw,
  Settings,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PlayerAccount } from "spicylib/schema";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { PlayerBrowser } from "@/components/PlayerBrowser";
import { ScoringExplorer } from "@/components/ScoringExplorer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import {
  deleteUserSpecs,
  downloadExportAsJson,
  exportUserSpecs,
  migrateUserSpecs,
} from "@/lib/user-migration";
import { checkIsAdmin, isWorkerAccount, jazzFetch } from "@/lib/worker-auth";

export function App(): React.JSX.Element {
  const { toast } = useToast();
  const logOut = useLogOut();
  const me = useAccount(PlayerAccount, {
    resolve: { root: true, profile: true },
  });
  const [activeTab, setActiveTab] = useState<string>("import");
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importResult, setImportResult] = useState<{
    specs: { created: number; updated: number; skipped: number };
    options: { created: number; updated: number };
    players: { created: number; updated: number; skipped: number };
    messages: { created: number; updated: number };
    errors: Array<{ item: string; error: string }>;
  } | null>(null);

  const [ghinNumber, setGhinNumber] = useState<string>("");
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [isLinkingPlayer, setIsLinkingPlayer] = useState<boolean>(false);
  const [linkGhinId, setLinkGhinId] = useState<string>("");
  const [gamesImportResult, setGamesImportResult] = useState<{
    games: { total: number; imported: number; failed: number };
    courses: { created: number; updated: number };
    rounds: { created: number };
    errors: Array<{ gameId: string; error: string }>;
  } | null>(null);

  // Import options
  const [importSpecs, setImportSpecs] = useState<boolean>(false);
  const [importPlayers, setImportPlayers] = useState<boolean>(false);
  const [importGames, setImportGames] = useState<boolean>(true);
  const [importMessages, setImportMessages] = useState<boolean>(false);
  const [gameLegacyId, setGameLegacyId] = useState<string>("");

  // Admin status (checked via API for security)
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3040/v4";
    if (me?.$isLoaded) {
      checkIsAdmin(apiUrl).then(setIsAdmin);
    }
  }, [me?.$isLoaded]);

  const handleImportToCatalog = async (): Promise<void> => {
    if (!me) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to import data",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(10);
    setImportResult(null);
    setGamesImportResult(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3040/v4";

      // Step 1: Import specs, players & messages (20-50%)
      if (importSpecs || importPlayers || importMessages) {
        setImportProgress(20);
        const specsResponse = await jazzFetch(`${apiUrl}/catalog/import`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            specs: importSpecs,
            players: importPlayers,
            messages: importMessages,
          }),
        });

        if (!specsResponse.ok) {
          throw new Error(`Specs import failed: ${specsResponse.statusText}`);
        }

        const specsResult = await specsResponse.json();
        setImportProgress(50);
        setImportResult(specsResult);
      } else {
        setImportProgress(50);
      }

      // Step 2: Import games (50-100%)
      if (!importGames) {
        setImportProgress(100);
        toast({
          title: "Import successful",
          description: "Imported specs and/or players",
        });
        return;
      }

      const gamesResponse = await jazzFetch(`${apiUrl}/catalog/import-games`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          gameLegacyId.trim() ? { legacyId: gameLegacyId.trim() } : {},
        ),
      });

      if (!gamesResponse.ok) {
        throw new Error(`Games import failed: ${gamesResponse.statusText}`);
      }

      const gamesResult = await gamesResponse.json();

      // Check if import was rejected due to already in progress
      if (gamesResult.inProgress) {
        toast({
          variant: "destructive",
          title: "Import already in progress",
          description: "Please wait for the current import to complete.",
        });
        setImportProgress(0);
        return;
      }

      setImportProgress(100);
      setGamesImportResult(gamesResult);

      // Combined toast notification
      const specsErrors = importResult?.errors?.length || 0;
      const totalErrors = specsErrors + (gamesResult.errors?.length || 0);
      if (totalErrors > 0) {
        toast({
          variant: "destructive",
          title: "Import completed with errors",
          description: `${totalErrors} errors occurred. See details below.`,
        });
        if (importResult?.errors) {
          console.error("Specs import errors:", importResult.errors);
        }
        console.error("Games import errors:", gamesResult.errors);
      } else {
        toast({
          title: "Import successful",
          description: `Imported specs, players, and ${gamesResult.games.imported} games`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
      setImportProgress(0);
    } finally {
      setIsImporting(false);
    }
  };

  const handleLinkPlayer = async (): Promise<void> => {
    if (!me) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to link player",
      });
      return;
    }

    if (!linkGhinId.trim()) {
      toast({
        variant: "destructive",
        title: "GHIN ID required",
        description: "Please enter your GHIN ID",
      });
      return;
    }

    setIsLinkingPlayer(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3040/v4";

      const response = await jazzFetch(`${apiUrl}/player/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ghinId: linkGhinId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Link failed: ${response.statusText}`,
        );
      }

      const result = await response.json();

      // me and me.root are resolved by useAccount with { resolve: { root: true } }
      if (!me?.$isLoaded || !me.root?.$isLoaded) {
        throw new Error(
          "Your account or root is not loaded - please try again in a moment",
        );
      }

      const root = me.root;

      const { Game } = await import("spicylib/schema");

      // Wait a moment for Jazz to sync the group membership and root.player update from API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Initialize games list if it doesn't exist
      const { ListOfGames } = await import("spicylib/schema");
      if (!root.$jazz.has("games")) {
        root.$jazz.set(
          "games",
          ListOfGames.create([], { owner: root.$jazz.owner }),
        );
      }

      // Load and add each game to root.games
      const gameIds = result.gameIds || [];
      let gamesLinked = 0;

      // Ensure games list is loaded before adding
      const loadedRoot = await root.$jazz.ensureLoaded({
        resolve: { games: true },
      });

      if (loadedRoot.games?.$isLoaded) {
        // Get existing game IDs to avoid duplicates
        const existingGameIds = new Set<string>();
        const gamesList = loadedRoot.games as Iterable<
          (typeof loadedRoot.games)[number]
        >;
        for (const existingGame of gamesList) {
          if (existingGame?.$jazz?.id) {
            existingGameIds.add(existingGame.$jazz.id);
          }
        }

        for (const gameId of gameIds) {
          if (existingGameIds.has(gameId)) {
            continue; // Skip duplicates
          }
          const game = await Game.load(gameId);
          if (game?.$isLoaded) {
            loadedRoot.games.$jazz.push(game);
            gamesLinked++;
          } else {
            console.warn(`Failed to load game ${gameId}`);
          }
        }
        console.log(`Added ${gamesLinked} games to root.games`);
      } else {
        console.error("Failed to load root.games after ensureLoaded");
      }

      toast({
        title: "Player linked successfully",
        description: `Linked ${result.playerName} and ${gamesLinked} game(s) to your account`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Link failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsLinkingPlayer(false);
    }
  };

  const handleExportSpecs = async (): Promise<void> => {
    if (!me) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to export specs",
      });
      return;
    }

    try {
      const exportData = await exportUserSpecs(
        me as co.loaded<typeof PlayerAccount>,
      );
      downloadExportAsJson(exportData);

      toast({
        title: "Export successful",
        description: `Exported ${exportData.specs.length} specs to JSON file`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const handleDeleteSpecs = async (): Promise<void> => {
    if (!me) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to delete specs",
      });
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete all your game specs? This cannot be undone!",
    );

    if (!confirmed) {
      return;
    }

    try {
      const count = await deleteUserSpecs(
        me as co.loaded<typeof PlayerAccount>,
      );

      toast({
        title: "Specs deleted",
        description: `Deleted ${count} game specs from your account`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const handleMigrateSpecs = async (): Promise<void> => {
    if (!me) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to migrate specs",
      });
      return;
    }

    const confirmed = window.confirm(
      "This will export your specs to JSON and then delete them from your account. Continue?",
    );

    if (!confirmed) {
      return;
    }

    setIsMigrating(true);

    try {
      const result = await migrateUserSpecs(
        me as co.loaded<typeof PlayerAccount>,
      );
      downloadExportAsJson(result.export);

      toast({
        title: "Migration complete",
        description: `Exported and deleted ${result.deleted} specs`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Migration failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSaveGhinNumber = (): void => {
    if (!ghinNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Please enter a valid GHIN number",
      });
      return;
    }

    toast({
      title: "GHIN number saved",
      description: `Your GHIN number ${ghinNumber} has been saved to your profile`,
    });
  };

  const handleLogout = (): void => {
    logOut();
  };

  const isWorker = me ? isWorkerAccount(me.$jazz.id) : false;
  // isAdmin is set via useEffect + API call above
  const userName =
    me?.$isLoaded && me.profile?.$isLoaded ? me.profile.name : "User";

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            Spicy Golf Developer Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage game catalog, import data, and configure your profile
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span>
                Logged in as {userName}
                {isWorker && (
                  <strong className="text-green-600"> (Worker Account)</strong>
                )}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="import">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </TabsTrigger>
            <TabsTrigger value="browse">
              <BookOpen className="mr-2 h-4 w-4" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="scoring">
              <Calculator className="mr-2 h-4 w-4" />
              Scoring
            </TabsTrigger>
            <TabsTrigger value="migration">
              <Download className="mr-2 h-4 w-4" />
              Migration
            </TabsTrigger>
            <TabsTrigger value="profile">
              <Settings className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import v0.3 Data</CardTitle>
                <CardDescription>
                  Import game specifications, options, and players from ArangoDB
                  and JSON files (worker account only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isAdmin && (
                  <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
                    <p className="text-sm text-yellow-800">
                      Only authorized administrators can import data. You can
                      browse and customize specs instead.
                    </p>
                  </div>
                )}

                {isAdmin && (
                  <>
                    <div className="rounded-md border border-green-200 bg-green-50 p-4">
                      <p className="text-sm text-green-800">
                        Authorized administrator. Ready to import.
                      </p>
                    </div>

                    <div className="space-y-3 rounded-md border p-4">
                      <Label className="text-sm font-medium">
                        Import Options
                      </Label>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={importSpecs}
                            onChange={(e) => setImportSpecs(e.target.checked)}
                            disabled={isImporting}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="text-sm">Game Specs</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={importPlayers}
                            onChange={(e) => setImportPlayers(e.target.checked)}
                            disabled={isImporting}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="text-sm">Players</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={importGames}
                            onChange={(e) => setImportGames(e.target.checked)}
                            disabled={isImporting}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="text-sm">Games</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={importMessages}
                            onChange={(e) =>
                              setImportMessages(e.target.checked)
                            }
                            disabled={isImporting}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="text-sm">Error Messages</span>
                        </label>
                      </div>
                      {importGames && (
                        <div className="mt-3 space-y-2">
                          <Label htmlFor="gameLegacyId" className="text-sm">
                            Single Game Legacy ID (optional)
                          </Label>
                          <Input
                            id="gameLegacyId"
                            placeholder="Leave blank to import all games"
                            value={gameLegacyId}
                            onChange={(e) => setGameLegacyId(e.target.value)}
                            disabled={isImporting}
                            className="max-w-xs"
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter an ArangoDB _key to import only that game
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleImportToCatalog}
                      disabled={
                        !isAdmin ||
                        isImporting ||
                        (!importSpecs &&
                          !importPlayers &&
                          !importGames &&
                          !importMessages)
                      }
                      className="w-full"
                      size="lg"
                    >
                      {isImporting ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Import from ArangoDB
                    </Button>

                    {importProgress > 0 && (
                      <div className="space-y-2">
                        <Label>Import Progress</Label>
                        <Progress value={importProgress} />
                      </div>
                    )}

                    {importResult && (
                      <div className="space-y-4 rounded-md border p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">
                            Import Results
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setImportResult(null)}
                          >
                            Dismiss
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="rounded-md border p-3">
                            <div className="text-sm font-medium text-muted-foreground">
                              Game Specs
                            </div>
                            <div className="mt-2 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-green-600">Created:</span>
                                <span className="font-medium">
                                  {importResult.specs.created}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-600">Updated:</span>
                                <span className="font-medium">
                                  {importResult.specs.updated}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Skipped:</span>
                                <span className="font-medium">
                                  {importResult.specs.skipped}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-md border p-3">
                            <div className="text-sm font-medium text-muted-foreground">
                              Options
                            </div>
                            <div className="mt-2 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-green-600">Created:</span>
                                <span className="font-medium">
                                  {importResult.options.created}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-600">Updated:</span>
                                <span className="font-medium">
                                  {importResult.options.updated}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-md border p-3">
                            <div className="text-sm font-medium text-muted-foreground">
                              Players
                            </div>
                            <div className="mt-2 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-blue-600">Imported:</span>
                                <span className="font-medium">
                                  {importResult.players.updated}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-yellow-600">
                                  Skipped:
                                </span>
                                <span className="font-medium">
                                  {importResult.players.skipped}
                                </span>
                              </div>
                            </div>
                          </div>

                          {importResult.messages &&
                            (importResult.messages.created > 0 ||
                              importResult.messages.updated > 0) && (
                              <div className="rounded-md border p-3">
                                <div className="text-sm font-medium text-muted-foreground">
                                  Error Messages
                                </div>
                                <div className="mt-2 space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-green-600">
                                      Created:
                                    </span>
                                    <span className="font-medium">
                                      {importResult.messages.created}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-blue-600">
                                      Updated:
                                    </span>
                                    <span className="font-medium">
                                      {importResult.messages.updated}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>

                        {importResult.errors.length > 0 && (
                          <div className="rounded-md border border-red-200 bg-red-50 p-3">
                            <div className="text-sm font-medium text-red-900">
                              Errors ({importResult.errors.length})
                            </div>
                            <div className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
                              {importResult.errors.map((err) => (
                                <div
                                  key={`${err.item}-${err.error}`}
                                  className="text-red-800"
                                >
                                  <span className="font-medium">
                                    {err.item}:
                                  </span>{" "}
                                  {err.error}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {importResult.players.skipped > 0 && (
                          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
                            <div className="text-sm font-medium text-yellow-900">
                              Why were players skipped?
                            </div>
                            <div className="mt-1 text-xs text-yellow-800">
                              Players are skipped if they are missing required
                              fields (name, gender) or don't have a GHIN ID.
                              Check the console logs for details.
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {gamesImportResult && (
                      <div className="space-y-4 rounded-md border p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">
                            Games Import Results
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setGamesImportResult(null)}
                          >
                            Dismiss
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="rounded-md border p-3">
                            <div className="text-sm font-medium text-muted-foreground">
                              Games
                            </div>
                            <div className="mt-2 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total:</span>
                                <span className="font-medium">
                                  {gamesImportResult.games.total}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-green-600">
                                  Imported:
                                </span>
                                <span className="font-medium">
                                  {gamesImportResult.games.imported}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-red-600">Failed:</span>
                                <span className="font-medium">
                                  {gamesImportResult.games.failed}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-md border p-3">
                            <div className="text-sm font-medium text-muted-foreground">
                              Courses
                            </div>
                            <div className="mt-2 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-green-600">Created:</span>
                                <span className="font-medium">
                                  {gamesImportResult.courses.created}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-600">Updated:</span>
                                <span className="font-medium">
                                  {gamesImportResult.courses.updated}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-md border p-3">
                            <div className="text-sm font-medium text-muted-foreground">
                              Rounds
                            </div>
                            <div className="mt-2 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-green-600">Created:</span>
                                <span className="font-medium">
                                  {gamesImportResult.rounds.created}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {gamesImportResult.errors.length > 0 && (
                          <div className="rounded-md border border-red-200 bg-red-50 p-3">
                            <div className="text-sm font-medium text-red-900">
                              Errors ({gamesImportResult.errors.length})
                            </div>
                            <div className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
                              {gamesImportResult.errors.map((err) => (
                                <div
                                  key={`${err.gameId}-${err.error}`}
                                  className="text-red-800"
                                >
                                  <span className="font-medium">
                                    Game {err.gameId}:
                                  </span>{" "}
                                  {err.error}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">How it works:</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    <li>
                      Imports game specs, options, players, games, rounds, and
                      courses from ArangoDB
                    </li>
                    <li>ArangoDB data takes precedence on conflicts</li>
                    <li>Idempotent: safe to run multiple times</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Link Player to Account</CardTitle>
                <CardDescription>
                  Link an imported player record to your account using your GHIN
                  ID
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="linkGhinId">Your GHIN ID</Label>
                  <Input
                    id="linkGhinId"
                    placeholder="Enter your GHIN ID"
                    value={linkGhinId}
                    onChange={(e) => setLinkGhinId(e.target.value)}
                    disabled={isLinkingPlayer}
                  />
                </div>

                <Button
                  onClick={handleLinkPlayer}
                  disabled={isLinkingPlayer || !linkGhinId.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isLinkingPlayer ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <User className="mr-2 h-4 w-4" />
                  )}
                  Link Player
                </Button>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">How it works:</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    <li>Finds the imported player by GHIN ID</li>
                    <li>Grants you admin access to the player record</li>
                    <li>Links the player to your account's root.player</li>
                    <li>You can now view and modify your player data</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="browse" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Browse Data</CardTitle>
                <CardDescription>
                  View imported game specifications, players, rounds, and games
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="catalog" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="catalog">Game Specs</TabsTrigger>
                    <TabsTrigger value="players">Players</TabsTrigger>
                    <TabsTrigger value="rounds">Rounds</TabsTrigger>
                    <TabsTrigger value="games">Games</TabsTrigger>
                  </TabsList>

                  <TabsContent value="catalog">
                    <CatalogBrowser
                      workerAccountId={
                        import.meta.env.VITE_JAZZ_WORKER_ACCOUNT || ""
                      }
                    />
                  </TabsContent>

                  <TabsContent value="players">
                    <PlayerBrowser
                      workerAccountId={
                        import.meta.env.VITE_JAZZ_WORKER_ACCOUNT || ""
                      }
                    />
                  </TabsContent>

                  <TabsContent value="rounds">
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        Round browser coming soon
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="games">
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        Game browser coming soon
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scoring" className="space-y-4">
            <ScoringExplorer />
          </TabsContent>

          <TabsContent value="migration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Data Migration</CardTitle>
                <CardDescription>
                  Export or delete your game specs (use before catalog
                  migration)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isWorker && (
                  <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
                    <p className="text-sm text-yellow-800">
                      Switch to your user account to manage personal specs.
                      Worker account manages the catalog only.
                    </p>
                  </div>
                )}

                {!isWorker && (
                  <div className="space-y-4">
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                      <h4 className="mb-2 font-medium text-blue-900">
                        Migration Workflow
                      </h4>
                      <ol className="list-decimal space-y-1 pl-5 text-sm text-blue-800">
                        <li>Export your specs to JSON (backup)</li>
                        <li>Delete specs from your account</li>
                        <li>
                          Use catalog specs with customizations going forward
                        </li>
                      </ol>
                    </div>

                    <div className="grid gap-4">
                      <Button onClick={handleExportSpecs} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export My Specs to JSON
                      </Button>

                      <Button onClick={handleDeleteSpecs} variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete All My Specs
                      </Button>

                      <Button
                        onClick={handleMigrateSpecs}
                        disabled={isMigrating}
                      >
                        {isMigrating ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        Export & Delete (Full Migration)
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Developer Profile</CardTitle>
                <CardDescription>
                  Manage your GHIN number and profile settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="ghin">GHIN Number</Label>
                  <Input
                    id="ghin"
                    value={ghinNumber}
                    onChange={(e) => setGhinNumber(e.target.value)}
                    placeholder="Enter your GHIN number"
                  />
                  <p className="text-sm text-muted-foreground">
                    Your GHIN number will be saved to your player profile
                  </p>
                </div>

                <Button onClick={handleSaveGhinNumber}>
                  <User className="mr-2 h-4 w-4" />
                  Save GHIN Number
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Toaster />
    </div>
  );
}
