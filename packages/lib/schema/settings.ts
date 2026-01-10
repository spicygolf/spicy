import { co, z } from "jazz-tools";

/**
 * User Settings
 *
 * Stores user preferences that sync across devices.
 */
export const Settings = co.map({
  /** Theme preference: light, dark, or system (follows device) */
  theme: z.literal(["light", "dark", "system"]).optional(),
});
