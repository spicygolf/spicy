import { scoring } from "common/utils/score";

import { makeGame } from "./score.util";

const hole1 = {
  hole: 1,
  par: 4,
  multipliers: [],
};

const hole2 = {
  hole: 2,
  par: 4,
  multipliers: [],
};

describe("common/utils/score - Options tests", () => {
  test("Options - Scoring - game option different on holes", () => {
    const data = [
      { player: 1, team: 1, hole: 1, score: 4, pops: 0, junk: [] },
      { player: 2, team: 1, hole: 1, score: 4, pops: 0, junk: [] },
      { player: 3, team: 2, hole: 1, score: 4, pops: 0, junk: [] },
      { player: 4, team: 2, hole: 1, score: 5, pops: 0, junk: [] },
      { player: 1, team: 1, hole: 2, score: 4, pops: 0, junk: [] },
      { player: 2, team: 1, hole: 2, score: 4, pops: 0, junk: [] },
      { player: 3, team: 2, hole: 2, score: 4, pops: 0, junk: [] },
      { player: 4, team: 2, hole: 2, score: 5, pops: 0, junk: [] },
    ];
    const game = makeMatchplayGame({ holes: [hole1, hole2], data });
    const scores = scoring(game);

    // hole 1 - tie, no second ball breaks tie
    let received = scores.holes[0].teams.map((t) => ({
      team: parseInt(t.team, 10),
      points: t.points,
    }));
    expect(received).toContainEqual(
      { team: 1, points: 0 },
      { team: 2, points: 0 },
    );

    // hole 2 - tie, second ball breaks tie
    received = scores.holes[1].teams.map((t) => ({
      team: parseInt(t.team, 10),
      points: t.points,
    }));
    expect(received).toContainEqual(
      { team: 1, points: 1 },
      { team: 2, points: 0 },
    );
  });

  test("Options - Scoring - junk option different on holes", () => {
    const data = [
      { player: 1, team: 1, hole: 1, score: 3, pops: 0, junk: [] },
      { player: 2, team: 1, hole: 1, score: 4, pops: 0, junk: [] },
      { player: 3, team: 2, hole: 1, score: 4, pops: 0, junk: [] },
      { player: 4, team: 2, hole: 1, score: 4, pops: 0, junk: [] },
      { player: 1, team: 1, hole: 2, score: 3, pops: 0, junk: [] },
      { player: 2, team: 1, hole: 2, score: 3, pops: 0, junk: [] },
      { player: 3, team: 2, hole: 2, score: 3, pops: 0, junk: [] },
      { player: 4, team: 2, hole: 2, score: 4, pops: 0, junk: [] },
    ];
    const game = makeMatchplayGame({ holes: [hole1, hole2], data });
    const scores = scoring(game);

    // hole 1 - birdie, with option value 1
    let received = scores.holes[0].teams.map((t) => ({
      team: parseInt(t.team, 10),
      points: t.points,
    }));
    expect(received).toContainEqual(
      { team: 1, points: 2 }, // 1 for win, 1 for birdie
      { team: 2, points: 0 },
    );

    // hole 2 - birdie, with option value 2
    received = scores.holes[1].teams.map((t) => ({
      team: parseInt(t.team, 10),
      points: t.points,
    }));
    expect(received).toContainEqual(
      { team: 1, points: 5 }, // 1 for win, 4 for two birdies
      { team: 2, points: 2 }, // 1 for birdie
    );
  });

  test("Options - Scoring - multiplier option different on holes", () => {
    hole1.multipliers.push({ name: "double", team: "1", first_hole: "1" });
    hole2.multipliers.push({ name: "double", team: "2", first_hole: "2" });
    const data = [
      { player: 1, team: 1, hole: 1, score: 4, pops: 0, junk: [] },
      { player: 2, team: 1, hole: 1, score: 4, pops: 0, junk: [] },
      { player: 3, team: 2, hole: 1, score: 5, pops: 0, junk: [] },
      { player: 4, team: 2, hole: 1, score: 5, pops: 0, junk: [] },
      { player: 1, team: 1, hole: 2, score: 4, pops: 0, junk: [] },
      { player: 2, team: 1, hole: 2, score: 4, pops: 0, junk: [] },
      { player: 3, team: 2, hole: 2, score: 5, pops: 0, junk: [] },
      { player: 4, team: 2, hole: 2, score: 4, pops: 0, junk: [] },
    ];
    const game = makeMatchplayGame({ holes: [hole1, hole2], data });
    const scores = scoring(game);

    // hole 1 - 2x, with option value 'on'
    let received = scores.holes[0].teams.map((t) => ({
      team: parseInt(t.team, 10),
      holeNetTotal: t.holeNetTotal,
    }));
    //console.log('received', JSON.stringify(received, null, 2));
    expect(received).toContainEqual(
      { team: 1, holeNetTotal: 2 }, // 1 for win, x 2
      { team: 2, holeNetTotal: -2 },
    );

    // hole 2 - 2x, with option value 'off'
    received = scores.holes[1].teams.map((t) => ({
      team: parseInt(t.team, 10),
      holeNetTotal: t.holeNetTotal,
    }));
    expect(received).toContainEqual(
      { team: 1, holeNetTotal: 1 }, // 1 for win, no x 2
      { team: 2, holeNetTotal: -1 },
    );
  });
});

/* ======================================================================= */
//     helper functions
/* ======================================================================= */

const makeMatchplayGame = ({ holes, data }) => {
  return makeGame({
    gamespecs: [
      {
        type: "match",
        options: [
          {
            name: "low_ball",
            disp: "Low Ball",
            seq: 1,
            type: "junk",
            value: 1,
            limit: "one_team_per_group",
            scope: "team",
            icon: "album",
            show_in: "score",
            based_on: "net",
            calculation: "best_ball",
            better: "lower",
            sub_type: "dot",
          },
          {
            name: "birdie",
            disp: "Birdie",
            seq: 2,
            type: "junk",
            value: 1,
            limit: "",
            scope: "player",
            icon: "album",
            show_in: "score",
            score_to_par: "exactly -1",
            based_on: "gross",
            sub_type: "dot",
            holes: ["1"],
          },
          {
            name: "birdie",
            disp: "Birdie",
            seq: 2,
            type: "junk",
            value: 2,
            limit: "",
            scope: "player",
            icon: "album",
            show_in: "score",
            score_to_par: "exactly -1",
            based_on: "gross",
            sub_type: "dot",
            holes: ["2"],
          },
          {
            name: "double",
            disp: "2x",
            seq: 2,
            value: 2,
            icon: "album",
            based_on: "user",
            scope: "hole",
            availability:
              "{\n        'team_down_the_most': [\n          {'getPrevHole': []},\n          {'var': 'team'}\n        ]\n      }",
            type: "multiplier",
            holes: ["1"],
          },
          {
            name: "next_ball_breaks_ties",
            disp: "Next ball breaks ties",
            type: "game",
            value: false,
            sub_type: "bool",
            holes: ["1"],
          },
          {
            name: "next_ball_breaks_ties",
            disp: "Next ball breaks ties",
            type: "game",
            value: true,
            sub_type: "bool",
            holes: ["2"],
          },
        ],
        scoring: {
          hole: [],
        },
      },
    ],
    holes,
    data,
  });
};
