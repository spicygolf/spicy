
import { findIndex, orderBy, pick, uniqBy } from 'lodash';



export const getTeams = (players, gamespec) => {
  let teams = orderBy(
    uniqBy(players, 'team')
      .map(p => pick(p, ['team'])),
    ['team'],
    ['asc']
  );
  const max_teams = Math.floor(gamespec.max_players / gamespec.team_size);
  for( let t=1; t<= max_teams; t++ ) {
    if( findIndex(teams, {team: t}) < 0 ) {
      teams.push({team: t});
    }
  }

  return teams;
};

