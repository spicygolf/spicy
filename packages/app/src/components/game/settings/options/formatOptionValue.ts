import type { GameOption } from "spicylib/schema";

/**
 * Format a game option's raw value for human-readable display.
 *
 * Handles bool ("true"/"false" -> "Yes"/"No"), menu (name -> disp),
 * and passes through num/text values as-is.
 */
export function formatOptionValue(option: GameOption, value: string): string {
  switch (option.valueType) {
    case "bool":
      return value === "true" || value === "1" ? "Yes" : "No";
    case "menu": {
      const choice = option.choices?.find((c) => c.name === value);
      return choice ? choice.disp : value;
    }
    default:
      return value;
  }
}
