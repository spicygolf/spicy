import { co, z } from "jazz-tools";
import type { GameSpec } from "./gamespecs";
import { MapOfOptions } from "./options";

/**
 * GameSpecCustomization - Lightweight override of a catalog game spec
 *
 * This is Spicy Golf's superpower: users can customize catalog specs
 * without duplicating all the data. Just override what you want!
 *
 * Customizations inherit from the base catalog spec and only store overrides.
 * This means:
 * - Lightweight (just stores deltas)
 * - Can inherit updates from catalog spec
 * - Easy to see what changed
 *
 * Example:
 * - Base spec: Ten Points with default handicap mode
 * - Customization: Override handicap mode to "low" for your group
 */
export const GameSpecCustomization = co.map({
  baseSpecId: z.string(), // Reference to catalog spec by Jazz ID

  // Override metadata
  name: z.optional(z.string()),
  short: z.optional(z.string()),
  long_description: z.optional(z.string()),

  // Override options (unified map of all option types)
  optionOverrides: co.optional(MapOfOptions),

  // If true, replace all options from base spec (not merge)
  replaceAllOptions: z.optional(z.boolean()),
});
export type GameSpecCustomization = co.loaded<typeof GameSpecCustomization>;

export const ListOfGameSpecCustomizations = co.list(GameSpecCustomization);
export type ListOfGameSpecCustomizations = co.loaded<
  typeof ListOfGameSpecCustomizations
>;

/**
 * Helper function to get the effective metadata for a spec with customizations
 *
 * Note: This returns only the overridden metadata, not a full GameSpec object.
 * Use this to display customized names/descriptions in the UI.
 *
 * @param catalogSpec - Base spec from the public catalog
 * @param customization - User's overrides (optional)
 * @returns Object with effective metadata
 */
export function getEffectiveSpecMetadata(
  catalogSpec: GameSpec,
  customization?: GameSpecCustomization,
): {
  name: string;
  short: string;
  long_description?: string;
} {
  if (!customization) {
    return {
      name: catalogSpec.name,
      short: catalogSpec.short,
      long_description: catalogSpec.long_description,
    };
  }

  return {
    name: customization.name || catalogSpec.name,
    short: customization.short || catalogSpec.short,
    long_description:
      customization.long_description || catalogSpec.long_description,
  };
}

/**
 * Note: Option merging functions will be implemented when needed for the UI.
 * For now, customizations are stored separately and displayed alongside base specs.
 *
 * Future implementation will handle:
 * - Merging options with overrides (all three types in unified map)
 *
 * This requires proper Jazz CoMap manipulation which is better done
 * in the context of actual usage (web UI or app).
 */
