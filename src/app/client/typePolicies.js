
const typePolicies = {
  /*

      To address this problem (which is not a bug in Apollo Client), define a custom merge function for the Game.rounds field, so InMemoryCache can safely merge these objects:

        existing: [{"__ref":"95347021"}]
        incoming: []

      For more information about these options, please refer to the documentation:

        * Ensuring entity objects have IDs: https://go.apollo.dev/c/generating-unique-identifiers
        * Defining custom merge functions: https://go.apollo.dev/c/merging-non-normalized-objects
  */

  Game: {
    fields: {
      rounds: {
        merge: (existing, incoming) => {
          //console.log("Game.fields.rounds", existing, incoming);
          return incoming;
        },
      },
    },
  },
  Player: {
    fields: {
      handicap: {
        merge: (existing = {}, incoming) => {
          return {...existing, ...incoming};
        },
      },
    },
  },
  Handicap: {
    keyFields: false,
  },
  Posting: {
    keyFields: false,
  },
  /*
    Query: {
      fields: {
        activeGamesForPlayer: {
          merge: (existing = {}, incoming) => {
            return {...existing, ...incoming};
          },
        },
      },
    },
  */
};

export default typePolicies;

/*
    typePolicies: {
      Game: {
        keyFields: object => object._key,
      },
      Teams: {
        keyFields: (object, context) => {
          console.log('object', object, 'context', context);
          return;
        },
        fields: {

        },
      },
      TeamHole: {
        fields: {
          hole: {
            keyArgs: ['hole'],
          }
        },
      },
      Round: {
        keyFields: object => object._key,
      },
      Player: {
        keyFields: object => object._key,
      },
      Club: {
        keyFields: object => object._key,
      },
      Tee: {
        keyFields: object => object._key,
      },
      Course: {
        keyFields: object => object._key,
      },
      GameSpec: {
        keyFields: object => object._key,
      },
    },
  */