import { co, z } from "jazz-tools";

/**
 * User Settings
 *
 * Stores user preferences that sync across devices.
 */
export const Settings = co.map({
  /** Theme preference: light, dark, or system (follows device) */
  theme: z.literal(["light", "dark", "system"]).optional(),

  /** Whether user has confirmed saving their recovery passphrase externally */
  recoveryPhraseSaved: z.boolean().optional(),
});
