import {
  getHolesToUpdate,
  getWolfPlayerIndex,
  omitTypename,
  setTeamJunk,
} from "common/utils/game";

describe("common/utils/game tests", () => {
  // setTeamJunk
  test("setTeamJunk - one_per_group - this team - first selected", () => {
    const t = {
      team: "1",
      players: ["34483698", "65882391"],
      junk: [],
    };
    const junk = {
      name: "prox",
      limit: "one_per_group",
    };
    const newValue = true;
    const pkey = "65882391";

    const newT = {
      team: "1",
      players: ["34483698", "65882391"],
      junk: [
        {
          __typename: "GameJunk",
          name: "prox",
          player: "65882391",
          value: true,
        },
      ],
    };

    expect(setTeamJunk(t, junk, newValue, pkey)).toMatchObject(newT);
  });

  test("setTeamJunk - one_per_group - this team - deselected", () => {
    const t = {
      team: "1",
      players: ["34483698", "65882391"],
      junk: [{ name: "prox", player: "65882391", value: true }],
    };
    const junk = {
      name: "prox",
      limit: "one_per_group",
    };
    const newValue = false;
    const pkey = "65882391";

    const newT = {
      team: "1",
      players: ["34483698", "65882391"],
      junk: [],
    };

    expect(setTeamJunk(t, junk, newValue, pkey)).toMatchObject(newT);
  });

  test("setTeamJunk - one_per_group - this team - other player selected", () => {
    const t = {
      team: "1",
      players: ["34483698", "65882391"],
      junk: [{ name: "prox", player: "65882391", value: true }],
    };
    const junk = {
      name: "prox",
      limit: "one_per_group",
    };
    const newValue = true;
    const pkey = "34483698";

    const newT = {
      team: "1",
      players: ["34483698", "65882391"],
      junk: [{ name: "prox", player: "34483698", value: true }],
    };

    expect(setTeamJunk(t, junk, newValue, pkey)).toMatchObject(newT);
  });

  test("setTeamJunk - one_per_group - other team - first selected", () => {
    const t = {
      team: "1",
      players: ["34483698", "65882391"],
      junk: [],
    };
    const junk = {
      name: "prox",
      limit: "one_per_group",
    };
    const newValue = true;
    const pkey = "65885348";

    const newT = {
      team: "1",
      players: ["34483698", "65882391"],
      junk: [],
    };

    expect(setTeamJunk(t, junk, newValue, pkey)).toMatchObject(newT);
  });

  test("setTeamJunk - one_per_group - other team - deselected", () => {
    const t = {
      team: "1",
      players: ["34483698", "65882391"],
      junk: [],
    };
    const junk = {
      name: "prox",
      limit: "one_per_group",
    };
    const newValue = false;
    const pkey = "65885348";

    const newT = {
      team: "1",
      players: ["34483698", "65882391"],
      junk: [],
    };

    expect(setTeamJunk(t, junk, newValue, pkey)).toMatchObject(newT);
  });

  test("setTeamJunk - any limit - this team - first selected", () => {
    const t = {
      team: "1",
      players: ["34483698", "65882391"],
      junk: [],
    };
    const junk = {
      name: "fairway",
    };
    const newValue = true;
    const pkey = "34483698";

    const newT = {
      team: "1",
      players: ["34483698", "65882391"],
      junk: [{ name: "fairway", player: "34483698", value: true }],
    };

    expect(setTeamJunk(t, junk, newValue, pkey)).toMatchObject(newT);
  });

  test("setTeamJunk - any limit - this team - other player selected", () => {
    const t = {
      team: "1",
      players: ["34483698", "65882391"],
      junk: [{ name: "fairway", player: "34483698", value: true }],
    };
    const junk = {
      name: "fairway",
    };
    const newValue = true;
    const pkey = "65882391";

    const newT = {
      team: "1",
      players: ["34483698", "65882391"],
      junk: [
        { name: "fairway", player: "65882391", value: true },
        { name: "fairway", player: "34483698", value: true },
      ],
    };

    expect(setTeamJunk(t, junk, newValue, pkey)).toMatchObject(newT);
  });

  test("setTeamJunk - any limit - this team - first selected - with other junk", () => {
    const t = {
      team: "1",
      players: ["34483698", "65882391"],
      junk: [{ name: "prox", player: "65882391", value: true }],
    };
    const junk = {
      name: "fairway",
    };
    const newValue = true;
    const pkey = "34483698";

    const newT = {
      team: "1",
      players: ["34483698", "65882391"],
      junk: [
        { name: "fairway", player: "34483698", value: true },
        { name: "prox", player: "65882391", value: true },
      ],
    };

    expect(setTeamJunk(t, junk, newValue, pkey)).toMatchObject(newT);
  });

  test("omitTypename", () => {
    const data = {
      __typename: "Thing",
      _key: "key",
      obj_key: { k: 1, v: "2", __typename: "ObjThing" },
      arr_key: [
        { k: "1", v: "2", __typename: "ArrayThing" },
        { k: "3", v: "4", __typename: "ArrayThing" },
      ],
    };

    const newData = {
      _key: "key",
      obj_key: { k: 1, v: "2" },
      arr_key: [
        { k: "1", v: "2" },
        { k: "3", v: "4" },
      ],
    };

    expect(omitTypename(data)).toMatchObject(newData);
  });

  // getHolesToUpdate
  test("getHolesToUpdate - never", () => {
    const game = {
      scope: {
        holes: "all18",
        teams_rotate: "never",
      },
    };

    const holes = Array.from(Array(18).keys()).map((x) => (++x).toString());

    expect(getHolesToUpdate(game.scope.teams_rotate, game)).toEqual(holes);
  });

  test("getHolesToUpdate - rest of nine - hole 1", () => {
    const game = {
      scope: {
        holes: "all18",
        teams_rotate: "never",
      },
    };

    const holes = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

    expect(getHolesToUpdate("rest_of_nine", game, "1")).toEqual(holes);
  });

  test("getHolesToUpdate - rest of nine - hole 7", () => {
    const game = {
      scope: {
        holes: "all18",
        teams_rotate: "never",
      },
    };

    const holes = ["7", "8", "9"];

    expect(getHolesToUpdate("rest_of_nine", game, "7")).toEqual(holes);
  });

  test("getHolesToUpdate - rest of nine - hole 9", () => {
    const game = {
      scope: {
        holes: "all18",
        teams_rotate: "never",
      },
    };

    const holes = ["9"];

    expect(getHolesToUpdate("rest_of_nine", game, "9")).toEqual(holes);
  });

  test("getHolesToUpdate - rest of nine - hole 10", () => {
    const game = {
      scope: {
        holes: "all18",
        teams_rotate: "never",
      },
    };

    const holes = ["10", "11", "12", "13", "14", "15", "16", "17", "18"];

    expect(getHolesToUpdate("rest_of_nine", game, "10")).toEqual(holes);
  });

  test("getHolesToUpdate - rest of nine - hole 15", () => {
    const game = {
      scope: {
        holes: "all18",
        teams_rotate: "never",
      },
    };

    const holes = ["15", "16", "17", "18"];

    expect(getHolesToUpdate("rest_of_nine", game, "15")).toEqual(holes);
  });

  // wolf
  test("getWolfPlayerIndex - 4 players", () => {
    const game = {
      scope: {
        holes: "all18",
        wolf_order: ["1", "2", "3", "4"],
      },
      players: ["1p", "2p", "3p", "4p"],
    };

    expect(getWolfPlayerIndex({ game, currentHole: "1" })).toEqual(0);
    expect(getWolfPlayerIndex({ game, currentHole: "2" })).toEqual(1);
    expect(getWolfPlayerIndex({ game, currentHole: "3" })).toEqual(2);
    expect(getWolfPlayerIndex({ game, currentHole: "4" })).toEqual(3);
    expect(getWolfPlayerIndex({ game, currentHole: "5" })).toEqual(0);
    expect(getWolfPlayerIndex({ game, currentHole: "6" })).toEqual(1);
    expect(getWolfPlayerIndex({ game, currentHole: "7" })).toEqual(2);
    expect(getWolfPlayerIndex({ game, currentHole: "8" })).toEqual(3);
    expect(getWolfPlayerIndex({ game, currentHole: "9" })).toEqual(0);
    expect(getWolfPlayerIndex({ game, currentHole: "10" })).toEqual(1);
    expect(getWolfPlayerIndex({ game, currentHole: "11" })).toEqual(2);
    expect(getWolfPlayerIndex({ game, currentHole: "12" })).toEqual(3);
    expect(getWolfPlayerIndex({ game, currentHole: "13" })).toEqual(0);
    expect(getWolfPlayerIndex({ game, currentHole: "14" })).toEqual(1);
    expect(getWolfPlayerIndex({ game, currentHole: "15" })).toEqual(2);
    expect(getWolfPlayerIndex({ game, currentHole: "16" })).toEqual(3);
    expect(getWolfPlayerIndex({ game, currentHole: "17" })).toEqual(-1);
    expect(getWolfPlayerIndex({ game, currentHole: "18" })).toEqual(-1);
  });

  test("getWolfPlayerIndex - 5 players", () => {
    const game = {
      scope: {
        holes: "all18",
        wolf_order: ["1", "2", "3", "4", "5"],
      },
      players: ["1p", "2p", "3p", "4p", "5p"],
    };

    expect(getWolfPlayerIndex({ game, currentHole: "1" })).toEqual(0);
    expect(getWolfPlayerIndex({ game, currentHole: "2" })).toEqual(1);
    expect(getWolfPlayerIndex({ game, currentHole: "3" })).toEqual(2);
    expect(getWolfPlayerIndex({ game, currentHole: "4" })).toEqual(3);
    expect(getWolfPlayerIndex({ game, currentHole: "5" })).toEqual(4);
    expect(getWolfPlayerIndex({ game, currentHole: "6" })).toEqual(0);
    expect(getWolfPlayerIndex({ game, currentHole: "7" })).toEqual(1);
    expect(getWolfPlayerIndex({ game, currentHole: "8" })).toEqual(2);
    expect(getWolfPlayerIndex({ game, currentHole: "9" })).toEqual(3);
    expect(getWolfPlayerIndex({ game, currentHole: "10" })).toEqual(4);
    expect(getWolfPlayerIndex({ game, currentHole: "11" })).toEqual(0);
    expect(getWolfPlayerIndex({ game, currentHole: "12" })).toEqual(1);
    expect(getWolfPlayerIndex({ game, currentHole: "13" })).toEqual(2);
    expect(getWolfPlayerIndex({ game, currentHole: "14" })).toEqual(3);
    expect(getWolfPlayerIndex({ game, currentHole: "15" })).toEqual(4);
    expect(getWolfPlayerIndex({ game, currentHole: "16" })).toEqual(-1);
    expect(getWolfPlayerIndex({ game, currentHole: "17" })).toEqual(-1);
    expect(getWolfPlayerIndex({ game, currentHole: "18" })).toEqual(-1);
  });
});
