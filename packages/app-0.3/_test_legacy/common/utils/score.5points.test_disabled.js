import { scoring } from "common/utils/score";

import { makeGame } from "./score.util";

const hole1 = {
  hole: 1,
  par: 4,
  multipliers: [],
};

describe("common/utils/score - 5points tests", () => {
  test("5Points - Scoring - prox only", () => {
    const data = [
      { player: 1, team: 1, score: 4, pops: 0, junk: [{ name: "prox" }] },
      { player: 2, team: 1, score: 5, pops: 0, junk: [] },
      { player: 3, team: 2, score: 5, pops: 0, junk: [] },
      { player: 4, team: 2, score: 4, pops: 0, junk: [] },
    ];
    const game = make5PointsGame({ holes: [hole1], data });
    const scores = scoring(game);
    const received = scores.holes[0].teams.map((t) => ({
      team: parseInt(t.team, 10),
      points: t.points,
      holeNetTotal: t.holeNetTotal,
    }));
    expect(received).toContainEqual({ team: 1, points: 1, holeNetTotal: 1 });
    expect(received).toContainEqual({ team: 2, points: 0, holeNetTotal: -1 });
  });

  test("5Points - Scoring - 1 pt prox vs total", () => {
    const data = [
      { player: 1, team: 1, score: 4, pops: 0, junk: [{ name: "prox" }] },
      { player: 2, team: 1, score: 5, pops: 0, junk: [] },
      { player: 3, team: 2, score: 4, pops: 0, junk: [] },
      { player: 4, team: 2, score: 4, pops: 0, junk: [] },
    ];
    const game = make5PointsGame({ holes: [hole1], data });
    const scores = scoring(game);
    //console.log('scores - teams', JSON.stringify(scores.holes[0].teams, null, 2));
    const received = scores.holes[0].teams.map((t) => ({
      team: parseInt(t.team, 10),
      points: t.points,
      holeNetTotal: t.holeNetTotal,
    }));
    expect(received).toContainEqual({ team: 1, points: 1, holeNetTotal: -1 });
    expect(received).toContainEqual({ team: 2, points: 2, holeNetTotal: 1 });
  });

  test("5Points - Scoring - 3 to 2", () => {
    const data = [
      { player: 1, team: 1, score: 4, pops: 0, junk: [{ name: "prox" }] },
      { player: 2, team: 1, score: 7, pops: 0, junk: [] },
      { player: 3, team: 2, score: 5, pops: 0, junk: [] },
      { player: 4, team: 2, score: 5, pops: 0, junk: [] },
    ];
    const game = make5PointsGame({ holes: [hole1], data });
    const scores = scoring(game);
    //console.log('scores - teams', JSON.stringify(scores.holes[0].teams, null, 2));
    const received = scores.holes[0].teams.map((t) => ({
      team: parseInt(t.team, 10),
      points: t.points,
      holeNetTotal: t.holeNetTotal,
    }));
    expect(received).toContainEqual({ team: 1, points: 3, holeNetTotal: 1 });
    expect(received).toContainEqual({ team: 2, points: 2, holeNetTotal: -1 });
  });

  test("5Points - Scoring - clean sweep all 5", () => {
    const data = [
      { player: 1, team: 1, score: 4, pops: 0, junk: [{ name: "prox" }] },
      { player: 2, team: 1, score: 5, pops: 0, junk: [] },
      { player: 3, team: 2, score: 5, pops: 0, junk: [] },
      { player: 4, team: 2, score: 5, pops: 0, junk: [] },
    ];
    const game = make5PointsGame({ holes: [hole1], data });
    const scores = scoring(game);
    //console.log('scores - teams', JSON.stringify(scores.holes[0].teams, null, 2));
    const received = scores.holes[0].teams.map((t) => ({
      team: parseInt(t.team, 10),
      points: t.points,
      holeNetTotal: t.holeNetTotal,
    }));
    expect(received).toContainEqual({ team: 1, points: 5, holeNetTotal: 5 });
    expect(received).toContainEqual({ team: 2, points: 0, holeNetTotal: -5 });
  });

  test("5Points - Scoring - birdie, no bbq cuz prox", () => {
    const data = [
      { player: 1, team: 1, score: 3, pops: 0, junk: [] },
      { player: 2, team: 1, score: 4, pops: 0, junk: [] },
      { player: 3, team: 2, score: 4, pops: 0, junk: [] },
      { player: 4, team: 2, score: 4, pops: 0, junk: [{ name: "prox" }] },
    ];
    const game = make5PointsGame({ holes: [hole1], data });
    const scores = scoring(game);
    //console.log('scores - teams', JSON.stringify(scores.holes[0].teams, null, 2));
    const received = scores.holes[0].teams.map((t) => ({
      team: parseInt(t.team, 10),
      points: t.points,
      holeNetTotal: t.holeNetTotal,
    }));
    expect(received).toContainEqual({ team: 1, points: 5, holeNetTotal: 4 });
    expect(received).toContainEqual({ team: 2, points: 1, holeNetTotal: -4 });
  });

  test("5Points - Scoring - birdie, no bbq cuz tied total", () => {
    const data = [
      { player: 1, team: 1, score: 3, pops: 0, junk: [{ name: "prox" }] },
      { player: 2, team: 1, score: 5, pops: 0, junk: [] },
      { player: 3, team: 2, score: 4, pops: 0, junk: [] },
      { player: 4, team: 2, score: 4, pops: 0, junk: [] },
    ];
    const game = make5PointsGame({ holes: [hole1], data });
    const scores = scoring(game);
    //console.log('scores - teams', JSON.stringify(scores.holes[0].teams, null, 2));
    const received = scores.holes[0].teams.map((t) => ({
      team: parseInt(t.team, 10),
      points: t.points,
      holeNetTotal: t.holeNetTotal,
    }));
    expect(received).toContainEqual({ team: 1, points: 4, holeNetTotal: 4 });
    expect(received).toContainEqual({ team: 2, points: 0, holeNetTotal: -4 });
  });

  test("5Points - Scoring - birdie, no bbq cuz lost total", () => {
    const data = [
      { player: 1, team: 1, score: 3, pops: 0, junk: [{ name: "prox" }] },
      { player: 2, team: 1, score: 6, pops: 0, junk: [] },
      { player: 3, team: 2, score: 4, pops: 0, junk: [] },
      { player: 4, team: 2, score: 4, pops: 0, junk: [] },
    ];
    const game = make5PointsGame({ holes: [hole1], data });
    const scores = scoring(game);
    //console.log('scores - teams', JSON.stringify(scores.holes[0].teams, null, 2));
    const received = scores.holes[0].teams.map((t) => ({
      team: parseInt(t.team, 10),
      points: t.points,
      holeNetTotal: t.holeNetTotal,
    }));
    expect(received).toContainEqual({ team: 1, points: 4, holeNetTotal: 2 });
    expect(received).toContainEqual({ team: 2, points: 2, holeNetTotal: -2 });
  });

  test("5Points - Scoring - birdie, no bbq cuz birdie chop", () => {
    const data = [
      { player: 1, team: 1, score: 3, pops: 0, junk: [{ name: "prox" }] },
      { player: 2, team: 1, score: 6, pops: 0, junk: [] },
      { player: 3, team: 2, score: 3, pops: 0, junk: [] },
      { player: 4, team: 2, score: 4, pops: 0, junk: [] },
    ];
    const game = make5PointsGame({ holes: [hole1], data });
    const scores = scoring(game);
    //console.log('scores - teams', JSON.stringify(scores.holes[0].teams, null, 2));
    const received = scores.holes[0].teams.map((t) => ({
      team: parseInt(t.team, 10),
      points: t.points,
      holeNetTotal: t.holeNetTotal,
    }));
    expect(received).toContainEqual({ team: 1, points: 2, holeNetTotal: -1 });
    expect(received).toContainEqual({ team: 2, points: 3, holeNetTotal: 1 });
  });

  test("5Points - Scoring - birdie, no bbq cuz net tied low", () => {
    const data = [
      { player: 1, team: 1, score: 3, pops: 0, junk: [{ name: "prox" }] },
      { player: 2, team: 1, score: 6, pops: 0, junk: [] },
      { player: 3, team: 2, score: 4, pops: 1, junk: [] },
      { player: 4, team: 2, score: 4, pops: 0, junk: [] },
    ];
    const game = make5PointsGame({ holes: [hole1], data });
    const scores = scoring(game);
    //console.log('scores - teams', JSON.stringify(scores.holes[0].teams, null, 2));
    const received = scores.holes[0].teams.map((t) => ({
      team: parseInt(t.team, 10),
      points: t.points,
      holeNetTotal: t.holeNetTotal,
    }));
    expect(received).toContainEqual({ team: 1, points: 2, holeNetTotal: 0 });
    expect(received).toContainEqual({ team: 2, points: 2, holeNetTotal: 0 });
  });

  test("5Points - Scoring - birdie with bbq", () => {
    const data = [
      { player: 1, team: 1, score: 3, pops: 0, junk: [{ name: "prox" }] },
      { player: 2, team: 1, score: 4, pops: 0, junk: [] },
      { player: 3, team: 2, score: 4, pops: 0, junk: [] },
      { player: 4, team: 2, score: 4, pops: 0, junk: [] },
    ];
    const game = make5PointsGame({ holes: [hole1], data });
    const scores = scoring(game);
    //console.log('scores - teams', JSON.stringify(scores.holes[0].teams, null, 2));
    let received = scores.holes[0].teams.map((t) => ({
      team: parseInt(t.team, 10),
      points: t.points,
      holeNetTotal: t.holeNetTotal,
    }));
    expect(received).toContainEqual({ team: 1, points: 6, holeNetTotal: 12 });
    expect(received).toContainEqual({ team: 2, points: 0, holeNetTotal: -12 });
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
  // 12x
  // 16x
  // custom multiplier
});

/* ======================================================================= */
//     helper functions
/* ======================================================================= */

const make5PointsGame = ({ holes, data }) => {
  return makeGame({
    gamespecs: [
      {
        options: [
          {
            type: "junk",
            name: "low_ball",
            disp: "Low Ball",
            seq: 1,
            sub_type: "dot",
            value: 2,
            limit: "one_team_per_group",
            scope: "team",
            icon: "album",
            show_in: "team",
            based_on: "net",
            calculation: "best_ball",
            better: "lower",
          },
          {
            type: "junk",
            name: "low_total",
            disp: "Low Total",
            seq: 2,
            sub_type: "dot",
            value: 2,
            limit: "one_team_per_group",
            scope: "team",
            icon: "album",
            show_in: "team",
            based_on: "net",
            calculation: "sum",
            better: "lower",
          },
          {
            type: "junk",
            name: "prox",
            disp: "Prox",
            seq: 3,
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
            seq: 4,
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
            seq: 5,
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
