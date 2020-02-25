

export const scoring = () => {


  return staticScore();

};









const staticScore = () => {

  return {
    holes: [
      {
        hole: '1',
        teams: [
          {
            team: '1',
            players: [
              {
                pkey: '34483698',
                score: [
                  {gross: 3},
                  {net: 3},
                ],
                junk: [
                  {prox: 1},
                  {birdie: 1},
                ],
              },
              {
                pkey: '35217104',
                score: [
                  {gross: 4},
                  {net: 4},
                ],
                junk: [],
              },
            ],
            score: [
              {low_ball: 3},
              {low_team: 7},
            ],
            junk: [
              {
                name: 'low_ball',
                value: 2,
                icon: 'album',
                seq: 1,
              },
              {
                name: 'low_team',
                value: 2,
                icon: 'album',
                seq: 2,
              },
            ],
            multipliers: [
              {
                name: 'bbq',
                value: 2,
                icon: 'album',
                seq: 4,
              },
            ],
            total: 12,
          },
          {
            team: '2',
            players: [
              {
                pkey: '35216720',
                score: [
                  {gross: 4},
                  {net: 4},
                ],
                junk: [],
              },
              {
                pkey: '35217480',
                score: [
                  {gross: 4},
                  {net: 4},
                ],
                junk: [],
              },
            ],
            score: [
              {low_ball: 4},
              {low_team: 8},
            ],
            junk: [],
            multipliers: [],
            total: 0,
          },
        ],
      },
    ],
    totals : [
      {team: '1', total: 12},
      {team: '2', total: 0},
    ],
  };

};
