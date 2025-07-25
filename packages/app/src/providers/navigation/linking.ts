export const linking = {
  prefixes: [
    "spicygolf://",
    "spicy.golf://",
    "https://spicy.golf",
    "https://*.spicy.golf",
  ],
  config: {
    screens: {
      Games: {
        screens: {
          GamesList: "games",
          NewGame: "games/new",
          Game: {
            path: "games/:gameId",
            parse: {
              gameId: (gameId: string) => gameId,
            },
            screens: {
              GameSettingsNavigator: {
                path: "settings",
                screens: {
                  AddPlayerNavigator: {
                    path: "add-player",
                    screens: {
                      AddPlayerFavorites: "favorites",
                      AddPlayerGHIN: "ghin",
                      AddPlayerManual: "manual",
                    },
                  },
                },
              },
              GameScoring: "scoring",
            },
          },
        },
      },
      Profile: {
        screens: {
          ProfileHome: "profile/home",
        },
      },
    },
  },
};
