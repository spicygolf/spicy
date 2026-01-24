import { scoring } from "common/utils/score";

import { makeGame } from "./score.util";

const hole1 = {
  hole: 1,
  par: 4,
  multipliers: [],
};

describe("common/utils/score - 10Points tests", () => {
  test("10Points - Scoring - 3,3,3", () => {
    const data = [
      { player: 1, team: 1, score: 4, pops: 0, junk: [{ name: "prox" }] },
      { player: 2, team: 2, score: 4, pops: 0, junk: [] },
      { player: 3, team: 3, score: 5, pops: 1, junk: [] },
    ];
    const game = make10PointsGame({ holes: [hole1], data });
    const scores = scoring(game);
    const received = scores.holes[0].teams.map((t) => ({
      team: parseInt(t.team, 10),
      points: t.points,
      holeNetTotal: t.holeNetTotal,
    }));
    expect(received).toContainEqual({ team: 1, points: 4 });
    expect(received).toContainEqual({ team: 2, points: 3 });
    expect(received).toContainEqual({ team: 3, points: 3 });
  });

  test("10Points - Scoring - 5,3,1", () => {
    const data = [
      { player: 1, team: 1, score: 4, pops: 0, junk: [{ name: "prox" }] },
      { player: 2, team: 2, score: 5, pops: 0, junk: [] },
      { player: 3, team: 3, score: 6, pops: 0, junk: [] },
    ];
    const game = make10PointsGame({ holes: [hole1], data });
    const scores = scoring(game);
    const received = scores.holes[0].teams.map((t) => ({
      team: parseInt(t.team, 10),
      points: t.points,
      holeNetTotal: t.holeNetTotal,
    }));
    expect(received).toContainEqual({ team: 1, points: 6 });
    expect(received).toContainEqual({ team: 2, points: 3 });
    expect(received).toContainEqual({ team: 3, points: 1 });
  });

  test("10Points - Scoring - 4,4,1", () => {
    const data = [
      { player: 1, team: 1, score: 4, pops: 0, junk: [{ name: "prox" }] },
      { player: 2, team: 2, score: 4, pops: 0, junk: [] },
      { player: 3, team: 3, score: 5, pops: 0, junk: [] },
    ];
    const game = make10PointsGame({ holes: [hole1], data });
    const scores = scoring(game);
    const received = scores.holes[0].teams.map((t) => ({
      team: parseInt(t.team, 10),
      points: t.points,
      holeNetTotal: t.holeNetTotal,
    }));
    expect(received).toContainEqual({ team: 1, points: 5 });
    expect(received).toContainEqual({ team: 2, points: 4 });
    expect(received).toContainEqual({ team: 3, points: 1 });
  });

  test("10Points - Scoring - 5,2,2", () => {
    const data = [
      { player: 1, team: 1, score: 4, pops: 0, junk: [{ name: "prox" }] },
      { player: 2, team: 2, score: 5, pops: 0, junk: [] },
      { player: 3, team: 3, score: 5, pops: 0, junk: [] },
    ];
    const game = make10PointsGame({ holes: [hole1], data });
    const scores = scoring(game);
    const received = scores.holes[0].teams.map((t) => ({
      team: parseInt(t.team, 10),
      points: t.points,
      holeNetTotal: t.holeNetTotal,
    }));
    expect(received).toContainEqual({ team: 1, points: 6 });
    expect(received).toContainEqual({ team: 2, points: 2 });
    expect(received).toContainEqual({ team: 3, points: 2 });
  });

  test("10Points - Scoring - birdie with bbq", () => {
    const data = [
      { player: 1, team: 1, score: 3, pops: 0, junk: [{ name: "prox" }] },
      { player: 2, team: 2, score: 4, pops: 0, junk: [] },
      { player: 3, team: 3, score: 4, pops: 0, junk: [] },
    ];
    const game = make10PointsGame({ holes: [hole1], data });
    const scores = scoring(game);
    //console.log('scores - teams', JSON.stringify(scores.holes[0].teams, null, 2));
    let received = scores.holes[0].teams.map((t) => ({
      team: parseInt(t.team, 10),
      holeTotal: t.holeTotal,
    }));
    expect(received).toContainEqual({ team: 1, holeTotal: 14 });
    expect(received).toContainEqual({ team: 2, holeTotal: 4 });
    expect(received).toContainEqual({ team: 3, holeTotal: 4 });
    received = scores.holes[0].multipliers.map((m) => ({
      name: m.name,
    }));
    expect(received).toContainEqual({ name: "birdie_bbq" });
  });

  // TODO: tests for
  // eagle
  // birdie & eagle
  // 2 eagles
  // hole in one
  // albatross
  // pre2x
  // 2x
  // 2x back
  // custom multiplier
});

/* ======================================================================= */
//     helper functions
/* ======================================================================= */

const make10PointsGame = ({ holes, data }) => {
  return makeGame({
    gamespecs: [
      {
        options: [
          {
            type: "junk",
            name: "all_tie",
            disp: "",
            seq: 1,
            sub_type: "dot",
            value: 3,
            limit: "",
            scope: "team",
            icon: "",
            show_in: "none",
            based_on: "net",
            calculation: "logic",
            logic: "{'rankWithTies': [ 1, 3 ]}",
            better: "lower",
          },
          {
            type: "junk",
            name: "outright_winner",
            disp: "",
            seq: 2,
            sub_type: "dot",
            value: 5,
            limit: "",
            scope: "team",
            icon: "",
            show_in: "none",
            based_on: "net",
            calculation: "logic",
            logic: "{'rankWithTies': [ 1, 1 ]}",
            better: "lower",
          },
          {
            type: "junk",
            name: "2_tie_win",
            disp: "",
            seq: 3,
            sub_type: "dot",
            value: 4,
            limit: "",
            scope: "team",
            icon: "",
            show_in: "none",
            based_on: "net",
            calculation: "logic",
            logic: "{'rankWithTies': [ 1, 2 ]}",
            better: "lower",
          },
          {
            type: "junk",
            name: "all_diff_2",
            disp: "",
            seq: 4,
            sub_type: "dot",
            value: 3,
            limit: "",
            scope: "team",
            icon: "",
            show_in: "none",
            based_on: "net",
            calculation: "logic",
            logic: "{'rankWithTies': [ 2, 1 ]}",
            better: "lower",
          },
          {
            type: "junk",
            name: "2_tie_last",
            disp: "",
            seq: 5,
            sub_type: "dot",
            value: 2,
            limit: "",
            scope: "team",
            icon: "",
            show_in: "none",
            based_on: "net",
            calculation: "logic",
            logic: "{'rankWithTies': [ 2, 2 ]}",
            better: "lower",
          },
          {
            type: "junk",
            name: "dfl",
            disp: "",
            seq: 6,
            sub_type: "dot",
            value: 1,
            limit: "",
            scope: "team",
            icon: "",
            show_in: "none",
            based_on: "net",
            calculation: "logic",
            logic: "{'rankWithTies': [ 3, 1 ]}",
            better: "lower",
          },
          {
            type: "junk",
            name: "prox",
            disp: "Prox",
            seq: 7,
            sub_type: "dot",
            value: 1,
            limit: "one_per_group",
            scope: "player",
            icon: "album",
            show_in: "faves",
            based_on: "user",
          },
          {
            type: "junk",
            name: "birdie",
            disp: "Birdie",
            seq: 8,
            sub_type: "dot",
            value: 1,
            limit: "",
            scope: "player",
            icon: "album",
            show_in: "score",
            score_to_par: "exactly -1",
            based_on: "gross",
          },
          {
            type: "junk",
            name: "eagle",
            disp: "Eagle",
            seq: 9,
            sub_type: "dot",
            value: 2,
            limit: "",
            scope: "player",
            icon: "album",
            show_in: "score",
            score_to_par: "exactly -2",
            based_on: "gross",
          },
          {
            type: "multiplier",
            name: "pre_double",
            disp: "Pre 2x",
            seq: 1,
            value: 2,
            icon: "album",
            based_on: "user",
            scope: "rest_of_nine",
            availability: `{
                'team_down_the_most': [
                  {'getPrevHole': []},
                  {'var': 'team'}
                ]
              }`,
          },
          {
            type: "multiplier",
            name: "double",
            disp: "2x",
            seq: 2,
            value: 2,
            icon: "album",
            based_on: "user",
            scope: "hole",
            availability: `{
                'team_down_the_most': [
                  {'getPrevHole': []},
                  {'var': 'team'}
                ]
              }`,
          },
          {
            type: "multiplier",
            name: "double_back",
            disp: "2x back",
            seq: 3,
            value: 2,
            icon: "album",
            based_on: "user",
            scope: "hole",
            availability: `{
                'and': [
                  {'team_second_to_last': [
                    {'getPrevHole': []},
                    {'var': 'team'}
                  ]},
                  {'other_team_multiplied_with': [
                    {'getCurrHole': []},
                    {'var': 'team'},
                    'double'
                  ]}
                ]
              }`,
          },
          {
            type: "multiplier",
            name: "birdie_bbq",
            disp: "Birdie BBQ",
            seq: 4,
            value: 2,
            icon: "album",
            based_on: "birdie",
            scope: "hole",
            availability:
              "{ '===': [ {'var': 'team.points'}, {'var': 'possiblePoints'} ] }",
          },
          {
            type: "multiplier",
            name: "eagle_bbq",
            disp: "Eagle BBQ",
            seq: 5,
            value: 4,
            icon: "album",
            based_on: "eagle",
            scope: "hole",
            availability:
              "{ '===': [ {'var': 'team.points'}, {'var': 'possiblePoints'} ] }",
          },
        ],
        scoring: {
          hole: [],
        },
      },
    ],
    options: [],
    holes,
    data,
  });
};
