import { setTeamJunk } from 'common/utils/game';


describe('common/utils/game tests', () => {

  // setTeamJunk
  test('setTeamJunk - one_per_group - this team - first selected', () => {

    const t = {
      team: '1',
      players: ['34483698', '65882391'],
      junk: []
    };
    const junk = {
      name: 'prox',
      limit: 'one_per_group',
    };
    const newValue = true;
    const pkey = '65882391';

    const newT = {
      team: '1',
      players: ['34483698', '65882391'],
      junk: [{name: 'prox', player: '65882391', value: true}],
    };

    expect(setTeamJunk(t, junk, newValue, pkey)).toMatchObject(newT);

  });

  test('setTeamJunk - one_per_group - this team - deselected', () => {

    const t = {
      team: '1',
      players: ['34483698', '65882391'],
      junk: [{name: 'prox', player: '65882391', value: true}]
    };
    const junk = {
      name: 'prox',
      limit: 'one_per_group',
    };
    const newValue = false;
    const pkey = '65882391';

    const newT = {
      team: '1',
      players: ['34483698', '65882391'],
      junk: [],
    };

    expect(setTeamJunk(t, junk, newValue, pkey)).toMatchObject(newT);

  });

  test('setTeamJunk - one_per_group - this team - other player selected', () => {

    const t = {
      team: '1',
      players: ['34483698', '65882391'],
      junk: [{name: 'prox', player: '65882391', value: true}]
    };
    const junk = {
      name: 'prox',
      limit: 'one_per_group',
    };
    const newValue = true;
    const pkey = '34483698';

    const newT = {
      team: '1',
      players: ['34483698', '65882391'],
      junk: [{name: 'prox', player: '34483698', value: true}],
    };

    expect(setTeamJunk(t, junk, newValue, pkey)).toMatchObject(newT);

  });

  test('setTeamJunk - one_per_group - other team - first selected', () => {

    const t = {
      team: '1',
      players: ['34483698', '65882391'],
      junk: []
    };
    const junk = {
      name: 'prox',
      limit: 'one_per_group',
    };
    const newValue = true;
    const pkey = '65885348';

    const newT = {
      team: '1',
      players: ['34483698', '65882391'],
      junk: [],
    };

    expect(setTeamJunk(t, junk, newValue, pkey)).toMatchObject(newT);

  });

  test('setTeamJunk - one_per_group - other team - deselected', () => {

    const t = {
      team: '1',
      players: ['34483698', '65882391'],
      junk: []
    };
    const junk = {
      name: 'prox',
      limit: 'one_per_group',
    };
    const newValue = false;
    const pkey = '65885348';

    const newT = {
      team: '1',
      players: ['34483698', '65882391'],
      junk: [],
    };

    expect(setTeamJunk(t, junk, newValue, pkey)).toMatchObject(newT);

  });

  test('setTeamJunk - any limit - this team - first selected', () => {

    const t = {
      team: '1',
      players: ['34483698', '65882391'],
      junk: []
    };
    const junk = {
      name: 'fairway',
    };
    const newValue = true;
    const pkey = '34483698';

    const newT = {
      team: '1',
      players: ['34483698', '65882391'],
      junk: [{name: 'fairway', player: '34483698', value: true}],
    };

    expect(setTeamJunk(t, junk, newValue, pkey)).toMatchObject(newT);

  });

  test('setTeamJunk - any limit - this team - other player selected', () => {

    const t = {
      team: '1',
      players: ['34483698', '65882391'],
      junk: [{name: 'fairway', player: '34483698', value: true}]
    };
    const junk = {
      name: 'fairway',
    };
    const newValue = true;
    const pkey = '65882391';

    const newT = {
      team: '1',
      players: ['34483698', '65882391'],
      junk: [
        {name: 'fairway', player: '65882391', value: true},
        {name: 'fairway', player: '34483698', value: true},
      ],
    };

    expect(setTeamJunk(t, junk, newValue, pkey)).toMatchObject(newT);

  });

  test('setTeamJunk - any limit - this team - first selected - with other junk', () => {

    const t = {
      team: '1',
      players: ['34483698', '65882391'],
      junk: [{name: 'prox', player: '65882391', value: true}]
    };
    const junk = {
      name: 'fairway',
    };
    const newValue = true;
    const pkey = '34483698';

    const newT = {
      team: '1',
      players: ['34483698', '65882391'],
      junk: [
        {name: 'fairway', player: '34483698', value: true},
        {name: 'prox', player: '65882391', value: true},
      ],
    };

    expect(setTeamJunk(t, junk, newValue, pkey)).toMatchObject(newT);

  });



});
