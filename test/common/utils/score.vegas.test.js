import {
  scoring
} from 'common/utils/score';

import {
  makeGame,
} from './score.util';


const birdies_cancel_flip = true;

const hole1 = {
  hole: 1,
  par: 4,
  multipliers: [],
};

describe('common/utils/score - Vegas tests', () => {

  test('Vegas - Scoring - no blood', () => {
    const players_teams = [
      {player: 1, team: 1, score: 4, pops: 0, junk: []},
      {player: 2, team: 1, score: 5, pops: 0, junk: []},
      {player: 3, team: 2, score: 5, pops: 0, junk: []},
      {player: 4, team: 2, score: 4, pops: 0, junk: []},
    ];
    const game = makeVegasGame({birdies_cancel_flip, hole: hole1, players_teams});
    const scores = scoring(game);
    const received = scores.holes[0].teams.map(t => ({
      team: parseInt(t.team),
      points: t.points,
    }));
    expect(received).toContainEqual({team: 1, points: 45});
    expect(received).toContainEqual({team: 2, points: 45});
  });

  test('Vegas - Scoring - 1 pt', () => {
    const players_teams = [
      {player: 1, team: 1, score: 4, pops: 0, junk: []},
      {player: 2, team: 1, score: 5, pops: 0, junk: []},
      {player: 3, team: 2, score: 4, pops: 0, junk: []},
      {player: 4, team: 2, score: 4, pops: 0, junk: []},
    ];
    const game = makeVegasGame({birdies_cancel_flip, hole: hole1, players_teams});
    const scores = scoring(game);
    const received = scores.holes[0].teams.map(t => ({
      team: parseInt(t.team),
      points: t.points,
    }));
    expect(received).toContainEqual({team: 1, points: 45});
    expect(received).toContainEqual({team: 2, points: 44});
  });

  test('Vegas - Scoring - birdie flip w pop', () => {
    const players_teams = [
      {player: 1, team: 1, score: 3, pops: 0, junk: []},
      {player: 2, team: 1, score: 4, pops: 0, junk: []},
      {player: 3, team: 2, score: 4, pops: 0, junk: []},
      {player: 4, team: 2, score: 6, pops: 1, junk: []},
    ];
    const game = makeVegasGame({birdies_cancel_flip, hole: hole1, players_teams});
    const scores = scoring(game);
    //console.log('scores - teams', JSON.stringify(scores.holes[0].teams, null, 2));
    const received = scores.holes[0].teams.map(t => ({
      team: parseInt(t.team),
      points: t.points,
    }));
    expect(received).toContainEqual({team: 1, points: 34});
    expect(received).toContainEqual({team: 2, points: 54});
  });

  test('Vegas - Scoring - two birdies adds 10', () => {
    const players_teams = [
      {player: 1, team: 1, score: 3, pops: 0, junk: []},
      {player: 2, team: 1, score: 3, pops: 0, junk: []},
      {player: 3, team: 2, score: 4, pops: 0, junk: []},
      {player: 4, team: 2, score: 4, pops: 0, junk: []},
    ];
    const game = makeVegasGame({birdies_cancel_flip, hole: hole1, players_teams});
    const scores = scoring(game);
    //console.log('scores - teams', JSON.stringify(scores.holes[0].teams, null, 2));
    const received = scores.holes[0].teams.map(t => ({
      team: parseInt(t.team),
      holeNetTotal: t.holeNetTotal,
    }));
    // net total is 21 due to the +10 for two birdies
    expect(received).toContainEqual({team: 1, holeNetTotal:  21});
    expect(received).toContainEqual({team: 2, holeNetTotal: -21});
  });

  test('Vegas - Scoring - birdies cancel flip', () => {
    const players_teams = [
      {player: 1, team: 1, score: 3, pops: 0, junk: []},
      {player: 2, team: 1, score: 4, pops: 0, junk: []},
      {player: 3, team: 2, score: 3, pops: 0, junk: []},
      {player: 4, team: 2, score: 7, pops: 0, junk: []},
    ];
    const game = makeVegasGame({birdies_cancel_flip, hole: hole1, players_teams});
    const scores = scoring(game);
    //console.log('scores - teams', JSON.stringify(scores.holes[0].teams, null, 2));
    const received = scores.holes[0].teams.map(t => ({
      team: parseInt(t.team),
      points: t.points,
    }));
    expect(received).toContainEqual({team: 1, points: 34});
    expect(received).toContainEqual({team: 2, points: 37});
  });

  test('Vegas - Scoring - eagle adds 10', () => {
    const players_teams = [
      {player: 1, team: 1, score: 2, pops: 0, junk: []},
      {player: 2, team: 1, score: 4, pops: 0, junk: []},
      {player: 3, team: 2, score: 4, pops: 0, junk: []},
      {player: 4, team: 2, score: 6, pops: 0, junk: []},
    ];
    const game = makeVegasGame({birdies_cancel_flip, hole: hole1, players_teams});
    const scores = scoring(game);
    //console.log('scores - teams', JSON.stringify(scores.holes[0].teams, null, 2));
    const received = scores.holes[0].teams.map(t => ({
      team: parseInt(t.team),
      holeNetTotal: t.holeNetTotal,
    }));
    // net total is 40+10 due to the +10 for an eagle
    expect(received).toContainEqual({team: 1, holeNetTotal:  50});
    expect(received).toContainEqual({team: 2, holeNetTotal: -50});
  });


  test('Vegas - Scoring - eagle over birdie', () => {
    const players_teams = [
      {player: 1, team: 1, score: 2, pops: 0, junk: []},
      {player: 2, team: 1, score: 4, pops: 0, junk: []},
      {player: 3, team: 2, score: 3, pops: 0, junk: []},
      {player: 4, team: 2, score: 6, pops: 0, junk: []},
    ];
    const game = makeVegasGame({birdies_cancel_flip, hole: hole1, players_teams});
    const scores = scoring(game);
    //console.log('scores - teams', JSON.stringify(scores.holes[0].teams, null, 2));
    const received = scores.holes[0].teams.map(t => ({
      team: parseInt(t.team),
      holeNetTotal: t.holeNetTotal,
    }));
    // net total is (63-24) = 39 + 10 due to the eagle - birdie doesn't matter
    expect(received).toContainEqual({team: 1, holeNetTotal:  49});
    expect(received).toContainEqual({team: 2, holeNetTotal: -49});  });

  test('Vegas - Scoring - eagles cancel', () => {
    const players_teams = [
      {player: 1, team: 1, score: 2, pops: 0, junk: []},
      {player: 2, team: 1, score: 4, pops: 0, junk: []},
      {player: 3, team: 2, score: 2, pops: 0, junk: []},
      {player: 4, team: 2, score: 6, pops: 0, junk: []},
    ];
    const game = makeVegasGame({birdies_cancel_flip, hole: hole1, players_teams});
    const scores = scoring(game);
    //console.log('scores - teams', JSON.stringify(scores.holes[0].teams, null, 2));
    const received = scores.holes[0].teams.map(t => ({
      team: parseInt(t.team),
      holeNetTotal: t.holeNetTotal,
    }));
    expect(received).toContainEqual({team: 1, holeNetTotal:  2});
    expect(received).toContainEqual({team: 2, holeNetTotal: -2});  });

});



/* ======================================================================= */
//     helper functions
/* ======================================================================= */

const makeVegasGame = ({birdies_cancel_flip, hole, players_teams}) => {
  return makeGame(
    {
      gamespecs: [
        {
          better: 'lower',
          junk: [
            {
              "name": "birdie",
              "disp": "Birdie",
              "seq": 0,
              "type": "vegas",
              "value": 0,
              "limit": "",
              "scope": "player",
              "icon": "album",
              "show_in": "score",
              "score_to_par": "exactly -1",
              "based_on": "gross"
            },
            {
              "name": "eagle",
              "disp": "Eagle",
              "seq": 1,
              "type": "vegas",
              "value": 0,
              "limit": "",
              "scope": "player",
              "icon": "album",
              "show_in": "score",
              "score_to_par": "exactly -2",
              "based_on": "gross"
            },
            {
              "name": "two_birdies_add",
              "disp": "2 Birdies +10",
              "seq": 2,
              "type": "dot",
              "value": 10,
              "limit": "",
              "scope": "team",
              "icon": "album",
              "show_in": "score",
              "calculation": "logic",
              "logic": `{
                'and': [
                  {
                    '==': [
                      {'countJunk': [{'team': ['this']}, 'birdie']},
                      2
                    ]
                  },
                  {
                    '==': [
                      {'countJunk': [{'team': ['other']}, 'birdie']},
                      0
                    ]
                  },
                  {
                    '==': [
                      {'countJunk': [{'team': ['other']}, 'eagle']},
                      0
                    ]
                  }
                ]
              }`,
              "based_on": "gross",
              "better": "lower"
            },
            {
              "name": "eagle_add",
              "disp": "Eagle +10",
              "seq": 3,
              "type": "dot",
              "value": 10,
              "limit": "",
              "scope": "team",
              "icon": "album",
              "show_in": "score",
              "calculation": "logic",
              "logic": `{
                'and': [
                  {
                    '==': [
                      {'countJunk': [{'team': ['this']}, 'eagle']},
                      1
                    ]
                  },
                  {
                    '==': [
                      {'countJunk': [{'team': ['other']}, 'eagle']},
                      0
                    ]
                  }
                ]
              }`,
              "based_on": "gross",
              "better": "lower"
            },
            {
              "name": "two_eagles_add",
              "disp": "2 Eagles +20",
              "seq": 4,
              "type": "dot",
              "value": 20,
              "limit": "",
              "scope": "team",
              "icon": "album",
              "show_in": "score",
              "calculation": "logic",
              "logic": `{
                'and': [
                  {
                    '==': [
                      {'countJunk': [{'team': ['this']}, 'eagle']},
                      2
                    ]
                  },
                  {
                    '==': [
                      {'countJunk': [{'team': ['other']}, 'eagle']},
                      0
                    ]
                  }
                ]
              }`,
              "based_on": "gross",
              "better": "lower"
            }
          ],
          scoring: {
            hole: [
              {
                name: "team",
                disp: "Team Score",
                seq: 1,
                points: 0,
                source: "scores",
                scope: "team",
                type: "vegas",
                based_on: "net"
              },
            ],
          },
          options: [],
        },
      ],
      options: [
        {
          "name": "birdies_cancel_flip",
          "type": "bool",
          "value": birdies_cancel_flip
        },
      ],
      hole,
      players_teams,
    }
  );
}