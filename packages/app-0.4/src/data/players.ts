import type { Player } from 'spicylib/types';

export const brad: Player = {
  _type: 'player',
  name: 'Brad Anderson',
  email: 'brad@sankatygroup.com',
  short: 'boorad',
  statusAuthz: [
    'dev',
    'test',
    'prod'
  ],
  level: 'admin',
  handicap: {
    source: 'ghin',
    id: '1152839',
    firstName: 'Brad',
    lastName: 'Anderson',
    playerName: 'Brad Anderson',
    gender: 'M',
    active: true,
    index: '5.3',
    revDate: '2022-01-31',
  },
  round_id: 'boorad',
}

export const jp: Player = {
  _type: 'player',
  name: 'JP Pignetti',
  handicap: {
    source: 'ghin',
    id: '1319258',
    firstName: 'JP',
    lastName: 'Pignetti',
    playerName: 'Jp Pignetti',
    gender: 'M',
    active: true,
    index: '9.8',
    revDate: '2021-11-08'
  },
  email: 'johnpatrick_pignetti@acushnetgolf.com',
  short: 'jp',
  statusAuthz: [
    'prod',
    'test'
  ],
  round_id: 'jp',
};

export const efro: Player = {
  _type: 'player',
  name: 'Eric Froseth',
  handicap: {
    source: 'ghin',
    id: '1152771',
    firstName: 'Eric',
    lastName: 'Froseth',
    playerName: 'Eric Froseth',
    gender: 'M',
    active: true,
    index: '8.3',
    revDate: '2022-01-31'
  },
  email: 'efroseth@gmail.com',
  short: 'efro',
  statusAuthz: [
    'prod',
    'test'
  ],
  round_id: 'efro',
};

export const landers: Player = {
  _type: 'player',
  name: 'Tim Landers',
  handicap: {
    source: 'ghin',
    id: '2399051',
    firstName: 'Tim',
    lastName: 'Landers',
    playerName: 'Tim Landers',
    gender: 'M',
    active: true,
    index: '2.1',
    revDate: '2022-01-31'
  },
  email: 'timlanders@yahoo.com',
  short: 'landers',
  statusAuthz: [
    'prod'
  ],
  round_id: 'landers',
};

export const sedgie: Player = {
  _type: 'player',
  name: 'Sedgie Newsom',
  short: 'sedgie',
  handicap: {
    source: 'ghin',
    id: '7263853',
    firstName: 'Sedgie',
    lastName: 'Newsom',
    playerName: 'Sedgie Newsom',
    gender: 'M',
    active: true,
    index: '5.3',
    revDate: '2022-01-09'
  },
  round_id: 'sedgie',
};

export const kb: Player = {
  _type: 'player',
  name: 'Kenneth Barrett',
  handicap: {
    source: 'ghin',
    id: '753836',
    firstName: 'Ken',
    lastName: 'Barrett',
    playerName: 'Ken Barrett',
    gender: 'M',
    active: true,
    index: '4.7',
    revDate: '2022-01-17'
  },
  email: 'kjbdawg@gmail.com',
  short: 'kb',
  statusAuthz: [
    'prod',
    'test'
  ],
  round_id: 'kb',
};
