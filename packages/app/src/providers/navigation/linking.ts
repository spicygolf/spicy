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
                  GameSettings: "",
                  AddPlayerNavigator: {
                    path: "add-player",
                    screens: {
                      AddPlayerFavorites: "favorites",
                      AddPlayerSearch: "search",
                      AddPlayerManual: "manual",
                    },
                  },
                  AddRoundToGame: "add-round",
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
