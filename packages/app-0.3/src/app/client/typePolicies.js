import { cloneDeep, findIndex } from "lodash";

const typePolicies = {
  Query: {
    fields: {
      getFavoritePlayersForPlayer: {
        merge: (_existing = [], incoming) => {
          return incoming;
          //return {...existing, ...incoming};
        },
      },
    },
  },
  Player: {
    fields: {
      handicap: {
        merge: true,
      },
    },
  },
  Round: {
    fields: {
      scores: {
        merge: (existing = [], incoming) => {
          if (existing.length === 0) {
            return incoming;
          }
          const newScores = [];
          existing.map((h) => {
            newScores.push(cloneDeep(h));
          });
          incoming.map((h) => {
            const i = findIndex(newScores, { hole: h.hole });
            newScores[i] = {
              ...newScores[i],
              ...h,
            };
          });
          //console.log('Round.scores merge', existing, incoming, newScores);
          return newScores;
        },
      },
    },
  },
  GameHole: {
    keyFields: false,
  },
  GameScope: {
    keyFields: false,
  },
  Handicap: {
    keyFields: false,
  },
  Hole: {
    keyFields: false,
  },
  HoleScoringSpec: {
    keyFields: false,
  },
  JunkSpec: {
    keyFields: false,
  },
  OptionSpec: {
    keyFields: false,
  },
  Posting: {
    keyFields: false,
  },
  Rating: {
    keyFields: false,
  },
  Score: {
    keyFields: false,
  },
  ScoringSpec: {
    keyFields: false,
  },
  Value: {
    keyFields: false,
  },
};

export default typePolicies;
