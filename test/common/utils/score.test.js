import {
  vegasTeamScore
} from 'common/utils/score';



const s = {
  "name": "team",
  "disp": "Team Score",
  "seq": 1,
  "points": 0,
  "source": "scores",
  "scope": "team",
  "type": "vegas",
  "based_on": "net"
};

describe('common/utils/score tests', () => {

  test('vegasTeamScore - no blood', () => {
    const game = makeVegasOptionsGame(true, true, true);
    const team = makeTeam( 1, makePlayer(1, 4, 4, 0, []), makePlayer(2, 5, 4, 0, []) );
    const otherTeam = makeTeam( 2, makePlayer(3, 5, 4, 0, []), makePlayer(4, 4, 4, 0, []) );
    const teams = [team, otherTeam];
    const newTeam = {...team, holeTotal: 0, points: 45,};
    expect(vegasTeamScore({team, teams, game, s})).toMatchObject(newTeam);
    const newOtherTeam = {...otherTeam, points: 45,};
    expect(vegasTeamScore({team: otherTeam, teams, game, s})).toMatchObject(newOtherTeam);
  });

  test('vegasTeamScore - 1 pt', () => {
    const game = makeVegasOptionsGame(true, true, true);
    const team = makeTeam( 1, makePlayer(1, 4, 4, 0, []), makePlayer(2, 4, 4, 0, []) );
    const otherTeam = makeTeam( 2, makePlayer(3, 4, 4, 0, []), makePlayer(4, 5, 4, 0, []) );
    const teams = [team, otherTeam];
    const newTeam = {...team, points: 44,};
    expect(vegasTeamScore({team, teams, game, s})).toMatchObject(newTeam);
    const newOtherTeam = {...otherTeam, points: 45,};
    expect(vegasTeamScore({team: otherTeam, teams, game, s})).toMatchObject(newOtherTeam);
  });

  test('vegasTeamScore - birdie flip w pop', () => {
    const game = makeVegasOptionsGame(true, true, true);
    const team = makeTeam( 1, makePlayer(1, 3, 4, 0, [{name: 'birdie'}]), makePlayer(2, 4, 4, 0, []) );
    const otherTeam = makeTeam( 2, makePlayer(3, 4, 4, 0, []), makePlayer(4, 6, 4, 1, []) );
    const teams = [team, otherTeam];
    const newTeam = {...team, points: 34,};
    expect(vegasTeamScore({team, teams, game, s})).toMatchObject(newTeam);
    const newOtherTeam = {...otherTeam, points: 54,};
    expect(vegasTeamScore({team: otherTeam, teams, game, s})).toMatchObject(newOtherTeam);
  });

  test('vegasTeamScore - two birdies adds 10', () => {
    const game = makeVegasOptionsGame(true, true, true);
    const team = makeTeam( 1, makePlayer(1, 3, 4, 0, [{name: 'birdie'}]), makePlayer(2, 3, 4, 0, [{name: 'birdie'}]) );
    const otherTeam = makeTeam( 2, makePlayer(3, 4, 4, 0, []), makePlayer(4, 4, 4, 0, []) );
    const teams = [team, otherTeam];
    const newTeam = {...team, points: 33,};
    expect(vegasTeamScore({team, teams, game, s})).toMatchObject(newTeam);
    const newOtherTeam = {...otherTeam, points: 54,};
    expect(vegasTeamScore({team: otherTeam, teams, game, s})).toMatchObject(newOtherTeam);
  });

  test('vegasTeamScore - birdies cancel flip', () => {
    const game = makeVegasOptionsGame(true, true, true);
    const team = makeTeam( 1, makePlayer(1, 3, 4, 0, [{name: 'birdie'}]), makePlayer(2, 4, 4, 0, []) );
    const otherTeam = makeTeam( 2, makePlayer(3, 3, 4, 0, [{name: 'birdie'}]), makePlayer(4, 7, 4, 0, []) );
    const teams = [team, otherTeam];
    const newTeam = {...team, points: 34,};
    expect(vegasTeamScore({team, teams, game, s})).toMatchObject(newTeam);
    const newOtherTeam = {...otherTeam, points: 37,};
    expect(vegasTeamScore({team: otherTeam, teams, game, s})).toMatchObject(newOtherTeam);
  });

  test('vegasTeamScore - eagle adds 10', () => {
    const game = makeVegasOptionsGame(true, true, true);
    const team = makeTeam( 1, makePlayer(1, 2, 4, 0, [{name: 'eagle'}]), makePlayer(2, 4, 4, 0, []) );
    const otherTeam = makeTeam( 2, makePlayer(3, 4, 4, 0, []), makePlayer(4, 6, 4, 0, []) );
    const teams = [team, otherTeam];
    const newTeam = {...team, points: 24,};
    expect(vegasTeamScore({team, teams, game, s})).toMatchObject(newTeam);
    const newOtherTeam = {...otherTeam, points: 74,};
    expect(vegasTeamScore({team: otherTeam, teams, game, s})).toMatchObject(newOtherTeam);
  });

  test('vegasTeamScore - eagle over birdie', () => {
    const game = makeVegasOptionsGame(true, true, true);
    const team = makeTeam( 1, makePlayer(1, 2, 4, 0, [{name: 'eagle'}]), makePlayer(2, 4, 4, 0, []) );
    const otherTeam = makeTeam( 2, makePlayer(3, 3, 4, 0, [{name: 'birdie'}]), makePlayer(4, 6, 4, 0, []) );
    const teams = [team, otherTeam];
    const newTeam = {...team, points: 24,};
    expect(vegasTeamScore({team, teams, game, s})).toMatchObject(newTeam);
    const newOtherTeam = {...otherTeam, points: 73,};
    expect(vegasTeamScore({team: otherTeam, teams, game, s})).toMatchObject(newOtherTeam);
  });

  test('vegasTeamScore - eagles cancel', () => {
    const game = makeVegasOptionsGame(true, true, true);
    const team = makeTeam( 1, makePlayer(1, 2, 4, 0, [{name: 'eagle'}]), makePlayer(2, 4, 4, 0, []) );
    const otherTeam = makeTeam( 2, makePlayer(3, 2, 4, 0, [{name: 'eagle'}]), makePlayer(4, 7, 4, 0, []) );
    const teams = [team, otherTeam];
    const newTeam = {...team, points: 24,};
    expect(vegasTeamScore({team, teams, game, s})).toMatchObject(newTeam);
    const newOtherTeam = {...otherTeam, points: 27,};
    expect(vegasTeamScore({team: otherTeam, teams, game, s})).toMatchObject(newOtherTeam);
  });

});



/* ======================================================================= */
//     helper functions
/* ======================================================================= */


const makePlayer = (key, gross, par, pops, junk) => ({
  pkey: key.toString(),
  score: {
    gross: {value: gross.toString(), toPar: (gross - par)},
    net: {value: (gross - pops).toString(), toPar: (gross - pops)},
    points: {value: 0, toPar: null},
    pops: {value: pops, toPar: null},
  },
  junk,
});

const makeTeam = (key, p1, p2) => ({
  holeTotal: 0,
  junk: [],
  matchDiff: 0,
  matchOver: false,
  players: [p1, p2],
  points: 0,
  runningTotal: 0,
  scores: [],
  team: key.toString(),

});

const makeGame = ({gamespecs = [], options = []}) => ({
  gamespecs,
  options,
});

const makeVegasOptionsGame = (two_birdies_adds_10, eagle_adds_10, birdies_cancel_flip) => {
  return makeGame(
    {
      options: [
        {
          "name": "two_birdies_same_team",
          "type": "bool",
          "value": two_birdies_adds_10
        },
        {
          "name": "eagle_adds_10",
          "type": "bool",
          "value": eagle_adds_10
        },
        {
          "name": "birdies_cancel_flip",
          "type": "bool",
          "value": birdies_cancel_flip
        },
      ],
    }
  );
}