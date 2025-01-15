export const linking = {
  prefixes: [
    'spicygolf://',
    'spicy.golf://',
    'https://spicy.golf',
    'https://*.spicy.golf',
  ],
  config: {
    screens: {
      Games: {
        screens: {
          GamesList: 'games',
          NewGame: 'games/new',
          Game: {
            screens: {
              GameSettings: 'games/:game/settings',
              GameScoring: 'games/:game/scoring',
            },
          },
        },
      },
      Profile: {
        screens: {
          ProfileHome: 'profile/home',
        },
      },
    },
  },
};
