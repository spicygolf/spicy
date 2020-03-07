
import { find, values } from 'lodash';

import { getHoles } from 'common/utils/game';



// return teams only if they are complete
export const getTeams = (game, hole) => {

  //console.log('getTeams - game', game, 'hole', hole);

  if( game && game.teams && game.teams.holes ) {

    let onTeam = {};
    game.players.map(p => {
      onTeam[p._key] = false;
    });

    const h = find(game.teams.holes, {hole: hole});
    //console.log('getTeams hole', h);
    if( !h || !h.teams ) return null;

    // check to see if we have proper pkeys in the player arrays of each team
    // if not, return null so the UI can re-do teams.
    h.teams.map(team => {
      if( !team || !team.players ) return null;
      team.players.map(pkey => {
        const p = find(game.players, {_key: pkey});
        //console.log('p', p);
        if( p ) onTeam[pkey] = true;
      });
    });

    if( values(onTeam).includes(false) ) {
      return null;
    } else {
      return h.teams;
    }

  } else {
    return null;
  }
};

// term can be:
//    never, every1, every3, every6 (for team choosing / rotation)
//    rest_of_nine, hole (for multiplier scope, uses currentHole)
export const getHolesToUpdate = (term, game, currentHole) => {

  const holes = getHoles(game);

  switch ( term ) {
    case 'never':
      return holes;
      break;
    case 'rest_of_nine':
      const begHole = parseInt(currentHole);
      const endHole = (Math.floor(begHole/9) * 9) + 9;
      const ret = holes.splice(begHole-1, endHole-begHole+1);
      console.log('rest_of_nine', begHole, endHole, ret);
      return ret;
      break;
    case 'hole':
      return [currentHole];
      break;
    default:
      console.log(`Unhandled term case: '${term}'`);
      break;
  };

};
