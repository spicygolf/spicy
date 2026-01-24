import { find, values } from "lodash";

// return teams only if they are complete
export const getTeams = (game, hole) => {
  if (game?.holes) {
    const onTeam = {};
    game.players.map((p) => {
      if (!p) {
        return;
      }
      onTeam[p._key] = false;
    });

    const h = find(game.holes, { hole: hole });
    if (!h || !h.teams) {
      return null;
    }

    // check to see if we have proper pkeys in the player arrays of each team
    // if not, return null so the UI can re-do teams.
    h.teams.map((team) => {
      if (!team || !team.players) {
        return null;
      }
      team.players.map((pkey) => {
        const p = find(game.players, { _key: pkey });
        if (p) {
          onTeam[pkey] = true;
        }
      });
    });

    if (values(onTeam).includes(false)) {
      return null;
    } else {
      return h.teams;
    }
  } else {
    return null;
  }
};

export const getScoreTeams = ({ scores, hole }) => {
  if (scores?.holes) {
    const h = find(scores.holes, { hole: hole });
    return h?.teams ? h.teams : [];
  } else {
    return [];
  }
};

export const getScoreTeamForPlayer = ({ scores, hole, pkey }) => {
  const teams = getScoreTeams({ scores, hole });
  const playerTeam = find(teams, (t) => {
    return find(t.players, { pkey });
  });
  return playerTeam;
};

export const getScorePlayersOnTeam = ({ scores, hole, pkey }) => {
  const team = getScoreTeamForPlayer({ scores, hole, pkey });
  return team?.players ? team.players : [];
};
