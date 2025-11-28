/**
 * User Spec Migration Utilities
 *
 * Tools for exporting and deleting user game specs.
 * Useful for migrating from user-owned specs to catalog-based workflow.
 */

import type { co } from "jazz-tools";
import type { PlayerAccount } from "spicylib/schema";

export interface UserSpecExport {
  userId: string;
  userName: string;
  specs: Array<{
    name: string;
    version: number;
    short: string;
    status: string;
    spec_type: string;
    min_players: number;
    location_type: string;
    long_description?: string;
  }>;
  exportedAt: string;
}

/**
 * Export user's game specs to JSON
 *
 * Loads all specs from user's root and exports them as JSON.
 * Returns data structure that can be saved to file.
 */
export async function exportUserSpecs(
  user: co.loaded<typeof PlayerAccount>,
): Promise<UserSpecExport> {
  // Load user profile and specs
  await user.$jazz.ensureLoaded({
    resolve: {
      root: {
        specs: {},
      },
      profile: true,
    },
  });

  // Check field existence before accessing
  if (!user.$jazz.has("root")) {
    throw new Error("User has no root");
  }

  const root = user.root;
  if (!root) {
    throw new Error("User root is null");
  }

  // Type assertion needed due to jazz-tools version mismatch
  // biome-ignore lint/suspicious/noExplicitAny: Required for jazz-tools version compatibility
  const rootAny = root as any;
  if (!rootAny.$jazz.has("specs")) {
    throw new Error("User has no specs to export");
  }

  const specs = rootAny.specs;
  if (!specs) {
    throw new Error("Specs list is null");
  }

  // Load all specs
  await specs.$jazz.ensureLoaded({});

  const exportedSpecs = [];
  for (const spec of specs) {
    if (spec?.$isLoaded) {
      exportedSpecs.push({
        name: spec.name,
        version: spec.version,
        short: spec.short,
        status: spec.status,
        spec_type: spec.spec_type,
        min_players: spec.min_players,
        location_type: spec.location_type,
        long_description: spec.long_description,
      });
    }
  }

  return {
    userId: user.$jazz.id,
    // biome-ignore lint/suspicious/noExplicitAny: Required for jazz-tools version compatibility
    userName: (user.profile as any)?.name || "Unknown",
    specs: exportedSpecs,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Delete all user game specs
 *
 * Clears the user's specs list. This is destructive!
 * Always export first using exportUserSpecs().
 */
export async function deleteUserSpecs(
  user: co.loaded<typeof PlayerAccount>,
): Promise<number> {
  await user.$jazz.ensureLoaded({
    resolve: { root: { specs: true } },
  });

  if (!user.root) {
    throw new Error("User has no root");
  }

  // Type assertion needed due to jazz-tools version mismatch
  // biome-ignore lint/suspicious/noExplicitAny: Required for jazz-tools version compatibility
  const root = user.root as any;
  if (!root.$jazz.has("specs")) {
    return 0;
  }

  const specs = root.specs;
  if (!specs) {
    return 0;
  }

  const count = specs.length;

  // Clear the list
  specs.$jazz.clear();

  return count;
}

/**
 * Complete migration: export then delete
 *
 * Safely migrates user specs by exporting first, then deleting.
 * Returns both the export data and count of deleted specs.
 */
export async function migrateUserSpecs(
  user: co.loaded<typeof PlayerAccount>,
): Promise<{ export: UserSpecExport; deleted: number }> {
  // Export first (safety)
  const exportData = await exportUserSpecs(user);

  // Then delete
  const deleted = await deleteUserSpecs(user);

  return { export: exportData, deleted };
}

/**
 * Download export data as JSON file
 *
 * Helper to trigger browser download of exported specs.
 */
export function downloadExportAsJson(
  exportData: UserSpecExport,
  filename?: string,
): void {
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `user-specs-${exportData.userId}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
