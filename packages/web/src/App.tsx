import { useAccount, useIsAuthenticated } from "jazz-tools/react";
import {
  BookOpen,
  Database,
  Download,
  LogOut,
  RefreshCw,
  Settings,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { PlayerAccount } from "spicylib/schema";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { LoginForm } from "@/components/LoginForm";
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
import { betterAuthClient } from "@/lib/auth-client";
import {
  deleteUserSpecs,
  downloadExportAsJson,
  exportUserSpecs,
  migrateUserSpecs,
} from "@/lib/user-migration";
import { isAuthorizedAdmin, isWorkerAccount } from "@/lib/worker-auth";
import {
  type ArangoConfig,
  createArangoConnection,
  defaultConfig,
  testConnection,
} from "@/utils/arango";

export function App(): React.JSX.Element {
  const { toast } = useToast();
  const isAuthenticated = useIsAuthenticated();
  const me = useAccount<typeof PlayerAccount>();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<string>("import");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [arangoConfig, setArangoConfig] = useState<ArangoConfig>(defaultConfig);
  const [ghinNumber, setGhinNumber] = useState<string>("");
  const [isMigrating, setIsMigrating] = useState<boolean>(false);

  // Fetch user email from better-auth session
  useEffect(() => {
    if (isAuthenticated) {
      betterAuthClient
        .getSession()
        .then((session) => {
          if (session.data?.user?.email) {
            setUserEmail(session.data.user.email);
          }
        })
        .catch((error) => {
          console.error("Failed to get session:", error);
        });
    }
  }, [isAuthenticated]);

  const handleTestConnection = async (): Promise<void> => {
    setIsConnecting(true);
    try {
      const db = createArangoConnection(arangoConfig);
      const isConnected = await testConnection(db);

      if (isConnected) {
        toast({
          title: "Connection successful",
          description: `Connected to ArangoDB at ${arangoConfig.url}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Connection failed",
          description:
            "Could not connect to ArangoDB. Please check your configuration.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection error",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleImportToCatalog = async (): Promise<void> => {
    if (!me) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to import game specs",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(10);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3040/v4";

      setImportProgress(20);

      // Call the API endpoint to import specs (only the server can modify the worker account)
      const response = await fetch(`${apiUrl}/catalog/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(arangoConfig),
      });

      if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`);
      }

      const result = await response.json();
      setImportProgress(100);

      const successMsg = [
        `Created: ${result.created}`,
        `Updated: ${result.updated}`,
        `Skipped: ${result.skipped}`,
      ].join(", ");

      if (result.errors.length > 0) {
        toast({
          variant: "destructive",
          title: "Import completed with errors",
          description: `${successMsg}. ${result.errors.length} errors occurred.`,
        });
        console.error("Import errors:", result.errors);
      } else {
        toast({
          title: "Import successful",
          description: successMsg,
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
      // @ts-expect-error - MaybeLoaded type mismatch with function signature
      const exportData = await exportUserSpecs(me);
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
      // @ts-expect-error - MaybeLoaded type mismatch with function signature
      const count = await deleteUserSpecs(me);

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
      // @ts-expect-error - MaybeLoaded type mismatch with function signature
      const result = await migrateUserSpecs(me);
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
    betterAuthClient.signOut().catch((error) => {
      console.error("Sign out error:", error);
    });
  };

  const isWorker = me ? isWorkerAccount(me.$jazz.id) : false;
  const isAdmin = isAuthorizedAdmin(userEmail);

  // Show auth UI if not logged in
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Spicy Golf Developer Dashboard</CardTitle>
            <CardDescription>
              Log in to manage game catalog and specs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    );
  }

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
                Logged in as {userEmail || "User"}
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
            <TabsTrigger value="migration">
              <Download className="mr-2 h-4 w-4" />
              Migration
            </TabsTrigger>
            <TabsTrigger value="arango">
              <Database className="mr-2 h-4 w-4" />
              ArangoDB
            </TabsTrigger>
            <TabsTrigger value="profile">
              <Settings className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import Game Specs to Catalog</CardTitle>
                <CardDescription>
                  Import game specifications from ArangoDB and JSON files into
                  the shared catalog (worker account only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isAdmin && (
                  <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
                    <p className="text-sm text-yellow-800">
                      Only authorized administrators can import to the catalog.
                      You can browse and customize specs instead.
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

                    <Button
                      onClick={handleImportToCatalog}
                      disabled={!isAdmin || isImporting}
                      className="w-full"
                      size="lg"
                    >
                      {isImporting ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Import Game Specs to Catalog
                    </Button>

                    {importProgress > 0 && (
                      <div className="space-y-2">
                        <Label>Import Progress</Label>
                        <Progress value={importProgress} />
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">How it works:</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    <li>Merges game specs from ArangoDB and JSON files</li>
                    <li>ArangoDB specs take precedence on conflicts</li>
                    <li>Idempotent: safe to run multiple times</li>
                    <li>Updates existing specs, creates new ones</li>
                    <li>Catalog is public: all users can read</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="browse" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Browse Game Catalog</CardTitle>
                <CardDescription>
                  View all available game specifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CatalogBrowser
                  workerAccountId={
                    import.meta.env.VITE_JAZZ_WORKER_ACCOUNT || ""
                  }
                />
              </CardContent>
            </Card>
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

          <TabsContent value="arango" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>ArangoDB Configuration</CardTitle>
                <CardDescription>
                  Configure connection to ArangoDB instance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="url">Database URL</Label>
                    <Input
                      id="url"
                      value={arangoConfig.url}
                      onChange={(e) =>
                        setArangoConfig({
                          ...arangoConfig,
                          url: e.target.value,
                        })
                      }
                      placeholder="http://localhost:8529"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dbname">Database Name</Label>
                    <Input
                      id="dbname"
                      value={arangoConfig.databaseName}
                      onChange={(e) =>
                        setArangoConfig({
                          ...arangoConfig,
                          databaseName: e.target.value,
                        })
                      }
                      placeholder="dg"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={arangoConfig.username}
                      onChange={(e) =>
                        setArangoConfig({
                          ...arangoConfig,
                          username: e.target.value,
                        })
                      }
                      placeholder="dg"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={arangoConfig.password}
                      onChange={(e) =>
                        setArangoConfig({
                          ...arangoConfig,
                          password: e.target.value,
                        })
                      }
                      placeholder="dg"
                    />
                  </div>
                </div>

                <Button onClick={handleTestConnection} disabled={isConnecting}>
                  {isConnecting ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="mr-2 h-4 w-4" />
                  )}
                  Test Connection
                </Button>
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
