import { describe, expect, it, mock } from "bun:test";
import type {
  GameSpec,
  MapOfOptions,
  MetaOption,
  StringList,
} from "../../schema";
import {
  copySpecOptions,
  getFrontNinePreDoubleTotalFromHoles,
  getMetaOption,
  getSpecField,
} from "../option-utils";

// =============================================================================
// Mock Helpers
// =============================================================================

/**
 * Create a mock MetaOption with text value
 */
function createTextMetaOption(
  name: string,
  value: string,
): Partial<MetaOption> {
  return {
    $isLoaded: true,
    name,
    disp: name,
    type: "meta",
    valueType: "text",
    value,
  } as Partial<MetaOption>;
}

/**
 * Create a mock MetaOption with number value
 */
function createNumMetaOption(name: string, value: number): Partial<MetaOption> {
  return {
    $isLoaded: true,
    name,
    disp: name,
    type: "meta",
    valueType: "num",
    value: String(value),
  } as Partial<MetaOption>;
}

/**
 * Create a mock MetaOption with boolean value
 */
function createBoolMetaOption(
  name: string,
  value: boolean,
): Partial<MetaOption> {
  return {
    $isLoaded: true,
    name,
    disp: name,
    type: "meta",
    valueType: "bool",
    value: String(value),
  } as Partial<MetaOption>;
}

/**
 * Create a mock MetaOption with text_array value (e.g., aliases)
 */
function createTextArrayMetaOption(
  name: string,
  values: string[],
): Partial<MetaOption> {
  const valueArray = [...values] as unknown as StringList;
  (valueArray as unknown as { $isLoaded: boolean }).$isLoaded = true;

  return {
    $isLoaded: true,
    name,
    disp: name,
    type: "meta",
    valueType: "text_array",
    valueArray,
  } as Partial<MetaOption>;
}

/**
 * Create a mock GameSpec (GameSpec IS the options map directly, no wrapper)
 */
function createMockSpec(
  options: Record<string, Partial<MetaOption>>,
  _topLevelFields: Partial<GameSpec> = {},
): Partial<GameSpec> {
  // GameSpec IS the options map directly - add $isLoaded and $jazz.has
  const spec = {
    $isLoaded: true,
    $jazz: {
      has: (key: string) => key in options,
    },
    ...options,
  };

  return spec as Partial<GameSpec>;
}

/**
 * Create a mock game hole with team options for pre_double testing
 */
function createMockGameHoleWithTeams(
  holeNum: string,
  teams: Array<{
    teamId: string;
    options?: Array<{ optionName: string; firstHole: string }>;
  }>,
) {
  return {
    hole: holeNum,
    $isLoaded: true,
    teams: {
      $isLoaded: true,
      [Symbol.iterator]: function* () {
        for (const team of teams) {
          yield {
            $isLoaded: true,
            team: team.teamId,
            options: team.options
              ? {
                  $isLoaded: true,
                  [Symbol.iterator]: function* () {
                    for (const opt of team.options ?? []) {
                      yield {
                        $isLoaded: true,
                        optionName: opt.optionName,
                        firstHole: opt.firstHole,
                      };
                    }
                  },
                }
              : undefined,
          };
        }
      },
    },
  };
}

// =============================================================================
// Tests: getMetaOption
// =============================================================================

describe("getMetaOption", () => {
  describe("text values", () => {
    it("returns text value from meta option", () => {
      const spec = createMockSpec({
        short: createTextMetaOption("short", "5pts"),
      });

      const result = getMetaOption(spec as GameSpec, "short");
      expect(result).toBe("5pts");
    });

    it("returns undefined for missing option", () => {
      const spec = createMockSpec({});

      const result = getMetaOption(spec as GameSpec, "short");
      expect(result).toBeUndefined();
    });
  });

  describe("number values", () => {
    it("returns parsed number from meta option", () => {
      const spec = createMockSpec({
        min_players: createNumMetaOption("min_players", 2),
      });

      const result = getMetaOption(spec as GameSpec, "min_players");
      expect(result).toBe(2);
    });

    it("returns parsed float from meta option", () => {
      const spec = createMockSpec({
        multiplier: createNumMetaOption("multiplier", 1.5),
      });

      const result = getMetaOption(spec as GameSpec, "multiplier");
      expect(result).toBe(1.5);
    });
  });

  describe("boolean values", () => {
    it("returns true for 'true' string", () => {
      const spec = createMockSpec({
        teams_only: createBoolMetaOption("teams_only", true),
      });

      const result = getMetaOption(spec as GameSpec, "teams_only");
      expect(result).toBe(true);
    });

    it("returns false for 'false' string", () => {
      const spec = createMockSpec({
        teams_only: createBoolMetaOption("teams_only", false),
      });

      const result = getMetaOption(spec as GameSpec, "teams_only");
      expect(result).toBe(false);
    });
  });

  describe("text_array values (aliases)", () => {
    it("returns array of strings", () => {
      const spec = createMockSpec({
        aliases: createTextArrayMetaOption("aliases", [
          "Scotch",
          "Umbrella",
          "Wolf",
        ]),
      });

      const result = getMetaOption(spec as GameSpec, "aliases");
      expect(result).toEqual(["Scotch", "Umbrella", "Wolf"]);
    });

    it("returns empty array for empty aliases", () => {
      const spec = createMockSpec({
        aliases: createTextArrayMetaOption("aliases", []),
      });

      const result = getMetaOption(spec as GameSpec, "aliases");
      expect(result).toEqual([]);
    });
  });

  describe("edge cases", () => {
    it("returns undefined for null spec", () => {
      const result = getMetaOption(null, "short");
      expect(result).toBeUndefined();
    });

    it("returns undefined for undefined spec", () => {
      const result = getMetaOption(undefined, "short");
      expect(result).toBeUndefined();
    });

    it("returns undefined for unloaded spec", () => {
      const spec = { $isLoaded: false } as unknown as GameSpec;
      const result = getMetaOption(spec, "short");
      expect(result).toBeUndefined();
    });

    it("returns undefined for non-meta option type", () => {
      const spec = createMockSpec({
        birdie: {
          $isLoaded: true,
          name: "birdie",
          type: "junk", // Not a meta option
          value: 1,
        } as unknown as Partial<MetaOption>,
      });

      const result = getMetaOption(spec as GameSpec, "birdie");
      expect(result).toBeUndefined();
    });

    // Note: "unloaded option" test removed - options are now plain JSON objects,
    // not CoMaps, so there's no $isLoaded state. If an option exists in the spec,
    // it's fully available.
  });
});

// =============================================================================
// Tests: getSpecField
// =============================================================================

describe("getSpecField", () => {
  describe("meta option values (new architecture)", () => {
    it("returns value from meta option when present", () => {
      const spec = createMockSpec({
        short: createTextMetaOption("short", "5pts"),
      });

      const result = getSpecField(spec as GameSpec, "short");
      expect(result).toBe("5pts");
    });

    it("prefers meta option over top-level field", () => {
      const spec = createMockSpec(
        { short: createTextMetaOption("short", "new-short") },
        { short: "old-short" },
      );

      const result = getSpecField(spec as GameSpec, "short");
      expect(result).toBe("new-short");
    });
  });

  describe("options-only schema (no top-level fallbacks)", () => {
    it("returns undefined when option not in options map", () => {
      // No fallback to top-level fields - options-only schema
      const spec = createMockSpec({});

      const result = getSpecField(spec as GameSpec, "short");
      expect(result).toBeUndefined();
    });

    it("returns value from options map for all field types", () => {
      const spec = createMockSpec({
        short: createTextMetaOption("short", "5pts"),
        long_description: createTextMetaOption(
          "long_description",
          "A fun game for everyone",
        ),
        status: createTextMetaOption("status", "prod"),
        spec_type: createTextMetaOption("spec_type", "points"),
        min_players: createNumMetaOption("min_players", 2),
        location_type: createTextMetaOption("location_type", "course"),
      });

      expect(getSpecField(spec as GameSpec, "short")).toBe("5pts");
      expect(getSpecField(spec as GameSpec, "long_description")).toBe(
        "A fun game for everyone",
      );
      expect(getSpecField(spec as GameSpec, "status")).toBe("prod");
      expect(getSpecField(spec as GameSpec, "spec_type")).toBe("points");
      expect(getSpecField(spec as GameSpec, "min_players")).toBe(2);
      expect(getSpecField(spec as GameSpec, "location_type")).toBe("course");
    });
  });

  describe("edge cases", () => {
    it("returns undefined for null spec", () => {
      const result = getSpecField(null, "short");
      expect(result).toBeUndefined();
    });

    it("returns undefined for unknown field", () => {
      const spec = createMockSpec({});
      const result = getSpecField(spec as GameSpec, "unknown_field");
      expect(result).toBeUndefined();
    });
  });
});

// =============================================================================
// Tests: getFrontNinePreDoubleTotalFromHoles
// =============================================================================

describe("getFrontNinePreDoubleTotalFromHoles", () => {
  it("returns 1 when no pre_double options exist", () => {
    const gameHoles = [
      createMockGameHoleWithTeams("1", [{ teamId: "1" }, { teamId: "2" }]),
      createMockGameHoleWithTeams("2", [{ teamId: "1" }, { teamId: "2" }]),
    ];

    const result = getFrontNinePreDoubleTotalFromHoles(
      gameHoles as Parameters<typeof getFrontNinePreDoubleTotalFromHoles>[0],
    );
    expect(result).toBe(1);
  });

  it("returns 2 for single pre_double on hole 1", () => {
    const gameHoles = [
      createMockGameHoleWithTeams("1", [
        {
          teamId: "1",
          options: [{ optionName: "pre_double", firstHole: "1" }],
        },
        { teamId: "2" },
      ]),
    ];

    const result = getFrontNinePreDoubleTotalFromHoles(
      gameHoles as Parameters<typeof getFrontNinePreDoubleTotalFromHoles>[0],
    );
    expect(result).toBe(2);
  });

  it("returns 4 for two pre_doubles on different holes", () => {
    const gameHoles = [
      createMockGameHoleWithTeams("1", [
        {
          teamId: "1",
          options: [{ optionName: "pre_double", firstHole: "1" }],
        },
        { teamId: "2" },
      ]),
      createMockGameHoleWithTeams("3", [
        {
          teamId: "1",
          options: [{ optionName: "pre_double", firstHole: "3" }],
        },
        { teamId: "2" },
      ]),
    ];

    const result = getFrontNinePreDoubleTotalFromHoles(
      gameHoles as Parameters<typeof getFrontNinePreDoubleTotalFromHoles>[0],
    );
    expect(result).toBe(4);
  });

  it("returns 8 for three pre_doubles (2x2x2)", () => {
    const gameHoles = [
      createMockGameHoleWithTeams("1", [
        {
          teamId: "1",
          options: [{ optionName: "pre_double", firstHole: "1" }],
        },
      ]),
      createMockGameHoleWithTeams("4", [
        {
          teamId: "1",
          options: [{ optionName: "pre_double", firstHole: "4" }],
        },
      ]),
      createMockGameHoleWithTeams("7", [
        {
          teamId: "1",
          options: [{ optionName: "pre_double", firstHole: "7" }],
        },
      ]),
    ];

    const result = getFrontNinePreDoubleTotalFromHoles(
      gameHoles as Parameters<typeof getFrontNinePreDoubleTotalFromHoles>[0],
    );
    expect(result).toBe(8);
  });

  it("counts pre_doubles from both teams", () => {
    const gameHoles = [
      createMockGameHoleWithTeams("1", [
        {
          teamId: "1",
          options: [{ optionName: "pre_double", firstHole: "1" }],
        },
        {
          teamId: "2",
          options: [{ optionName: "pre_double", firstHole: "1" }],
        },
      ]),
    ];

    const result = getFrontNinePreDoubleTotalFromHoles(
      gameHoles as Parameters<typeof getFrontNinePreDoubleTotalFromHoles>[0],
    );
    // Both teams pressed on hole 1: 2 * 2 = 4
    expect(result).toBe(4);
  });

  it("ignores pre_doubles on back nine (holes 10-18)", () => {
    const gameHoles = [
      createMockGameHoleWithTeams("10", [
        {
          teamId: "1",
          options: [{ optionName: "pre_double", firstHole: "10" }],
        },
      ]),
      createMockGameHoleWithTeams("15", [
        {
          teamId: "1",
          options: [{ optionName: "pre_double", firstHole: "15" }],
        },
      ]),
    ];

    const result = getFrontNinePreDoubleTotalFromHoles(
      gameHoles as Parameters<typeof getFrontNinePreDoubleTotalFromHoles>[0],
    );
    expect(result).toBe(1); // No front nine pre_doubles
  });

  it("only counts pre_double where firstHole matches hole number", () => {
    // This tests the deduplication logic - old imported data might have
    // the same pre_double option on multiple holes
    const gameHoles = [
      createMockGameHoleWithTeams("1", [
        {
          teamId: "1",
          options: [{ optionName: "pre_double", firstHole: "1" }],
        },
      ]),
      createMockGameHoleWithTeams("2", [
        {
          teamId: "1",
          // This has firstHole: "1" so it won't be counted again on hole 2
          options: [{ optionName: "pre_double", firstHole: "1" }],
        },
      ]),
    ];

    const result = getFrontNinePreDoubleTotalFromHoles(
      gameHoles as Parameters<typeof getFrontNinePreDoubleTotalFromHoles>[0],
    );
    // Only one pre_double should count (the one on hole 1 with firstHole: "1")
    expect(result).toBe(2);
  });

  it("returns 1 for empty game holes array", () => {
    const result = getFrontNinePreDoubleTotalFromHoles([]);
    expect(result).toBe(1);
  });

  it("ignores other multiplier options", () => {
    const gameHoles = [
      createMockGameHoleWithTeams("1", [
        {
          teamId: "1",
          options: [{ optionName: "double", firstHole: "1" }], // Not pre_double
        },
      ]),
      createMockGameHoleWithTeams("2", [
        {
          teamId: "1",
          options: [{ optionName: "press", firstHole: "2" }], // Not pre_double
        },
      ]),
    ];

    const result = getFrontNinePreDoubleTotalFromHoles(
      gameHoles as Parameters<typeof getFrontNinePreDoubleTotalFromHoles>[0],
    );
    expect(result).toBe(1); // Only pre_double matters
  });
});

// =============================================================================
// Tests: copySpecOptions
// =============================================================================

describe("copySpecOptions", () => {
  /**
   * Create a mock MapOfOptions that tracks set operations
   */
  function createMockMapOfOptions() {
    const storage: Record<string, unknown> = {};
    return {
      $isLoaded: true,
      $jazz: {
        has: (key: string) => key in storage,
        set: (key: string, value: unknown) => {
          storage[key] = value;
        },
        owner: {} as unknown,
      },
      // Expose storage for test assertions
      _storage: storage,
    };
  }

  /**
   * Create a mock source spec with options
   */
  function createMockSourceSpec(options: Record<string, unknown>) {
    return {
      $isLoaded: true,
      $jazz: {
        has: (key: string) => key in options,
      },
      ...options,
    };
  }

  it("copies all options from source to new MapOfOptions", async () => {
    const mockResult = createMockMapOfOptions();

    // Temporarily replace MapOfOptions.create
    const schema = await import("../../schema");
    const originalCreate = schema.MapOfOptions.create;
    schema.MapOfOptions.create = mock(
      () => mockResult as unknown as MapOfOptions,
    );

    try {
      const sourceSpec = createMockSourceSpec({
        birdie: { type: "junk", name: "birdie", value: 1 },
        eagle: { type: "junk", name: "eagle", value: 2 },
        min_players: { type: "meta", name: "min_players", value: "2" },
      });

      const mockGroup = {} as Parameters<typeof copySpecOptions>[1];
      copySpecOptions(sourceSpec as GameSpec, mockGroup);

      // Verify all options were copied
      expect(mockResult._storage.birdie).toEqual({
        type: "junk",
        name: "birdie",
        value: 1,
      });
      expect(mockResult._storage.eagle).toEqual({
        type: "junk",
        name: "eagle",
        value: 2,
      });
      expect(mockResult._storage.min_players).toEqual({
        type: "meta",
        name: "min_players",
        value: "2",
      });
    } finally {
      schema.MapOfOptions.create = originalCreate;
    }
  });

  it("creates deep copies (modifications don't affect original)", async () => {
    const mockResult = createMockMapOfOptions();

    const schema = await import("../../schema");
    const originalCreate = schema.MapOfOptions.create;
    schema.MapOfOptions.create = mock(
      () => mockResult as unknown as MapOfOptions,
    );

    try {
      const originalOption = {
        type: "junk",
        name: "birdie",
        value: 1,
        nested: { deep: "value" },
      };
      const sourceSpec = createMockSourceSpec({
        birdie: originalOption,
      });

      const mockGroup = {} as Parameters<typeof copySpecOptions>[1];
      copySpecOptions(sourceSpec as GameSpec, mockGroup);

      // Modify the copy
      const copiedOption = mockResult._storage.birdie as typeof originalOption;
      copiedOption.value = 999;
      copiedOption.nested.deep = "modified";

      // Original should be unchanged
      expect(originalOption.value).toBe(1);
      expect(originalOption.nested.deep).toBe("value");
    } finally {
      schema.MapOfOptions.create = originalCreate;
    }
  });

  it("skips $ prefixed keys and _refs", async () => {
    const mockResult = createMockMapOfOptions();

    const schema = await import("../../schema");
    const originalCreate = schema.MapOfOptions.create;
    schema.MapOfOptions.create = mock(
      () => mockResult as unknown as MapOfOptions,
    );

    try {
      const sourceSpec = createMockSourceSpec({
        birdie: { type: "junk", name: "birdie", value: 1 },
        $isLoaded: true,
        $jazz: { has: () => true },
        _refs: { some: "ref" },
      });

      const mockGroup = {} as Parameters<typeof copySpecOptions>[1];
      copySpecOptions(sourceSpec as GameSpec, mockGroup);

      // Only birdie should be copied
      expect(Object.keys(mockResult._storage)).toEqual(["birdie"]);
    } finally {
      schema.MapOfOptions.create = originalCreate;
    }
  });

  it("returns empty MapOfOptions for unloaded source", async () => {
    const mockResult = createMockMapOfOptions();

    const schema = await import("../../schema");
    const originalCreate = schema.MapOfOptions.create;
    schema.MapOfOptions.create = mock(
      () => mockResult as unknown as MapOfOptions,
    );

    try {
      const sourceSpec = { $isLoaded: false };

      const mockGroup = {} as Parameters<typeof copySpecOptions>[1];
      copySpecOptions(sourceSpec as GameSpec, mockGroup);

      // Nothing should be copied
      expect(Object.keys(mockResult._storage)).toEqual([]);
    } finally {
      schema.MapOfOptions.create = originalCreate;
    }
  });

  it("skips null/undefined options", async () => {
    const mockResult = createMockMapOfOptions();

    const schema = await import("../../schema");
    const originalCreate = schema.MapOfOptions.create;
    schema.MapOfOptions.create = mock(
      () => mockResult as unknown as MapOfOptions,
    );

    try {
      const sourceSpec = {
        $isLoaded: true,
        $jazz: {
          has: (key: string) =>
            ["birdie", "nullOption", "undefinedOption"].includes(key),
        },
        birdie: { type: "junk", name: "birdie", value: 1 },
        nullOption: null,
        undefinedOption: undefined,
      };

      const mockGroup = {} as Parameters<typeof copySpecOptions>[1];
      copySpecOptions(sourceSpec as unknown as GameSpec, mockGroup);

      // Only birdie should be copied (null/undefined skipped)
      expect(Object.keys(mockResult._storage)).toEqual(["birdie"]);
    } finally {
      schema.MapOfOptions.create = originalCreate;
    }
  });
});
