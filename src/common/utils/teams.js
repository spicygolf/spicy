
import { find } from 'lodash';



export const getTeams = (game, hole) => {
  if( game && game.teams && game.teams.holes ) {
    let gotem = true;
    const h = find(game.teams.holes, {hole: hole});
    if( !h || !h.teams ) return null;

    // check to see if we have proper pkeys in the player arrays of each team
    // if not, return null so the UI can re-do teams.
    h.teams.map(team => {
      if( !team || !team.players ) gotem = false;
      team.players.map(pkey => {
        const p = find(game.players, {_key: pkey});
        //console.log('p', p);
        if( !p ) gotem = false;
      });
    });

    if( gotem ) {
      return h.teams;
    } else {
      return null;
    }

  } else {
    return null;
  }
};

