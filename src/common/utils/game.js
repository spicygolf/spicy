import {
  cloneDeep,
  filter,
  find,
  findIndex,
  groupBy,
  isEqual,
  reduce
} from 'lodash';

import {
  ACTIVE_GAMES_FOR_PLAYER_QUERY,
} from 'features/games/graphql';
import { acronym, last } from 'common/utils/text';


/**
 *  return array of strings - hole numbers in the game
 *
 */
export const getHoles = game => {
  if( !game.holes || !game.holes.length ) {
    switch( game.scope.holes ) {
      case 'all18':
        return Array.from(Array(18).keys()).map(x => (++x).toString());
        break;
      case 'front9':
        return ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
        break;
      case 'back9':
        return ['10', '11', '12', '13', '14', '15', '16', '17', '18'];
        break;
      default:
        console.log(`getHoles - invalid value for holes: '${game.scope.holes}'`);
        break;
    }
  }
  return game.holes.map(h => h.hole.toString());
};

export const getRatings = (holes, tee) => {
  let ratings;

  switch (holes) {
    case 'front9':
      ratings = find(tee.Ratings, {RatingType: 'Front'});
      break;
    case 'back9':
      ratings = find(tee.Ratings, {RatingType: 'Back'});
      break;
    case 'all18':
      ratings = find(tee.Ratings, {RatingType: 'Total'});
      break;
    default:
      console.log(`course_handicap - invalid value for holes: '${holes}'`);
      break;
  }

  if( !ratings ) {
    ratings = {
      CourseRating: 0,
      SlopeRating: 0,
      BogeyRating: 0,
    };
  }

  return {
    rating: ratings.CourseRating,
    slope: ratings.SlopeRating,
    bogey: ratings.BogeyRating,
  };
};

export const getNewGameForUpdate = game => {

  // do this to get the exact right doc structure of a game to send
  // to updateGame mutation (i.e. no __typename keys that come from cache)
  let ret = {
    name: game.name,
    start: game.start,
    end: game.end,
    scope: {
      holes: game.scope.holes,
      teams_rotate: game.scope.teams_rotate,
    },
    holes: game.holes ? game.holes.map(h => {
      return {
        hole: h.hole,
        teams: h.teams ? h.teams.map(t => {
          return {
            team: t.team,
            players: t.players,
            junk: t.junk ? t.junk.map(j => {
              return {
                name: j.name,
                player: j.player,
                value: j.value,
              };
            }) : [],
          };
        }) : [],
        multipliers: h.multipliers ? h.multipliers.map(m => {
          return {
            name: m.name,
            team: m.team,
            first_hole: m.first_hole,
          };
        }) : [],
      };
    }) : [],
    options: game.options ? game.options.map(o => {
      return {
        name: o.name,
        values: o.values ? o.values.map(v => {
          return {
            value: v.value,
            holes: v.holes,
          }
        }) : [],
      };
    }) : [],
  };
  return cloneDeep(ret);

};

// https://stackoverflow.com/a/175787/598628
function isNumeric(str) {
  if (typeof str != "string") return false // we only process strings!
  return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
         !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

// Used to remove typename property from objects
// https://github.com/apollographql/apollo-feature-requests/issues/6#issuecomment-659596763
const isFile = value =>
  (typeof File !== 'undefined' && value instanceof File) || (typeof Blob !== 'undefined' && value instanceof Blob);

// From https://gist.github.com/Billy-/d94b65998501736bfe6521eadc1ab538
export const omitDeep = (value, key) => {
  if (Array.isArray(value)) {
    return value.map(i => omitDeep(i, key));
  } else if (typeof value === 'object' && value !== null && !isFile(value)) {
    return Object.keys(value).reduce((newObject, k) => {
      if (k === key) return newObject;
      return Object.assign({ [k]: omitDeep(value[k], key) }, newObject);
    }, {});
  }
  return value;
};

export const omitTypename = value => omitDeep(value, '__typename');


export const getAllGamespecOptions = game => {
  let options = [];
  game.gamespecs.map(gs => {
    gs.options.map(o => {
      options.push({
        ...o,
        gamespec_key: gs._key,
      });
    });
  });
  return options;
};


export const getAllOptions = ({game, type}) => {
  let options = [];
  const gsOptions = getAllGamespecOptions(game);
  if( gsOptions && gsOptions.length ) gsOptions.map(gso => {
    if( gso.type === type ) {
      let values = gso.values;
      if( typeof values === 'undefined' || values === null || values.length === 0 ) {
        values = [
          {value: gso.default, holes: game.holes.map(h => h.hole)}
        ];
      }
      values = values.map(v => ({
        ...v,
        holes: (v.holes !== null) ? v.holes : game.holes.map(h => h.hole)
      }));
      // console.log('values', values);
      let o = {
        ...gso,
        values,
        key: `${gso.gamespec_key}_${gso.name}`,
      };
      // if found, a game option overrides a gamespec option
      const go = find(game.options, {name: gso.name});
      // console.log('game options', go, gso.name, game.options);
      if( go ) o = {
        ...o,
        values: go.values,
      }
      options.push(o);
    }
  });
  return options;
};


export const getOption = ({game, hole, option, type}) => {

  let v = null;
  const allOptions = getAllOptions({game, type});
  console.log('allOptions', allOptions, hole);

  const go = find(allOptions, o => (
    o.name == option.name && isOptionOnThisHole({option, hole})
  ));
  if( go && go.value ) v = go.value;
  console.log('2', go, v);

  // convert bool
  if( (go && go.type == 'bool') ) {
    v = (v === true || v === 'true');
  }

  // convert number
  if( isNumeric(v) ) v = parseFloat(v);
  console.log('3', go, v);

  //console.log('FIXME, there is no `value` field anymore');
  //console.log('option', option, v);
  return {
    name: option,
    value: v,
  };
}

export const isOptionOnThisHole = ({option, hole}) => {
  if ( !option ) return false;
  let ret = false;
  option.values.map(v => {
    if( v.holes?.indexOf(hole) >= 0 ) ret = true;
  });
  // console.log('isOptionOnThisHole', option, hole, ret);
  return ret;
};


export const isSameHolesList = (holes1, holes2) => {
  return isEqual(holes1, holes2);
};

export const getGamespecKVs = (game, key) => {
  //console.log('getGamespecKVs game', game);
  const ret = game.gamespecs.map(gs => {
    return gs[key];
  });
  return ret;
};


export const getJunk = (junkName, pkey, game, holeNum) => {
  if( !game || !game.holes ) return null;
  const gHole = find(game.holes, {hole: holeNum});
  if( !gHole || !gHole.teams ) return null;
  const gTeam = find(gHole.teams, t => ( t && t.players && t.players.includes(pkey) ));
  if( !gTeam || !gTeam.junk ) return null;
  const j = find(gTeam.junk, {name: junkName, player: pkey});
  console.log('j', j, gTeam);
  if( !j || !j.values ) return null;
  const jo = getOption({game, hole: holeNum, option: j, type: 'junk'});
  console.log('jo', jo);
  return jo.value;
};


export const setTeamJunk = (t, junk, newValue, pkey) => {

  if( findIndex(t.players, p => (p == pkey)) >= 0 ) {
    // this is the player's team for junk being set
    let newJunk = [];
    //console.log('team junk', t.junk);
    if( newValue ) {
      newJunk.push({
        __typename: 'GameJunk',
        name: junk.name,
        player: pkey,
        value: newValue,
      });
    }
    if( t.junk && t.junk.length ) {
      t.junk.map(j => {
        if( j.name == junk.name ) {
          if( (!junk.limit || junk.limit != 'one_per_group') && j.player != pkey ) {
            newJunk.push(j);
          }
        } else {
          newJunk.push(j);
        }
      });
    }
    return {
      ...t,
      junk: newJunk,
    };
  } else {
    // this is not the player's team for junk being set
    let newJunk = [];
    if( t.junk && t.junk.length ) {
      t.junk.map(j => {
        if( j.name == junk.name ) {
          if( junk.limit != 'one_per_group' ) {
            newJunk.push(j);
          }
        } else {
          newJunk.push(j);
        }
      });
    }
    return {
      ...t,
      junk: newJunk,
    };
  }


};

export const rmgame = async (gkey, currentPlayerKey, mutation) => {
  const { loading, error, data } = await mutation({
    variables: {
      gkey: gkey
    },
    refetchQueries: [{
      query: ACTIVE_GAMES_FOR_PLAYER_QUERY,
      variables: {
        pkey: currentPlayerKey,
      },
      fetchPolicy: 'network-only',
    }],
    awaitFetchQueries: true,
  });
  if( error ) {
    console.log('error removing game', error);
    console.log('rmgame', gkey);
    return null;
  }
  return data;

};

/*
  term can be:
    never, every1, every3, every6 (for team choosing / rotation)
    rest_of_nine, hole (for multiplier scope, uses currentHole)
*/

export const getHolesToUpdate = (term, game, currentHole) => {

  const holes = getHoles(game);
  //console.log('getHolesToUpdate', holes, term, currentHole);
  let begHole, endHole, ret=[];

  switch ( term ) {
    case 'never':
      return holes;
      break;
    case 'rest_of_nine':
      begHole = parseInt(currentHole);
      endHole = (Math.floor((begHole-1)/9) * 9) + 9;
      ret = holes.splice(begHole-1, endHole-begHole+1);
      //console.log('rest_of_nine', begHole, endHole, ret);
      return ret;
      break;
    case 'hole':
    case 'every1':
      return [currentHole];
      break;
    case 'every3':
    case 'every6':
      const cnt = parseInt(term.charAt(term.length - 1));
      begHole = parseInt(currentHole);
      endHole = begHole + cnt - 1;
      ret = holes.splice(begHole-1, endHole-begHole+1);
      //console.log('everyX', cnt, begHole, endHole, ret);
      return ret;
      break;
    default:
      console.log(`Unhandled term case: '${term}'`);
      return [];
      break;
  };

}


export const addPlayerToOwnTeam = async ({pkey, game, updateGame}) => {

  const { _key: gkey } = game;
  let newGame = getNewGameForUpdate(game);

  const holesToUpdate = getHolesToUpdate(newGame.scope.teams_rotate, game);
  if( !newGame.holes ) {
    newGame.holes = [];
  }
  //console.log('holesToUpdate', holesToUpdate);
  holesToUpdate.map(h => {
    const holeIndex = findIndex(newGame.holes, {hole: h});
    if( holeIndex < 0 ) {
      // if hole data doesn't exist, create it with the single player team
      newGame.holes.push({
        hole: h,
        teams: [{
          team: '1', players: [pkey], junk: [],
        }],
        multipliers: [],
      });
    } else {
      // hole exists, so just add a new team with this player only
      if( newGame.holes[holeIndex].teams ) {
        let maxTeam = reduce(newGame.holes[holeIndex].teams, (max, t) => {
          const teamNum = parseInt(t.team);
          if( !teamNum ) return max;
          return (teamNum > max) ? teamNum : max;
        }, 0);
        //console.log('maxTeam', maxTeam);
        newGame.holes[holeIndex].teams.push({
          team: (++maxTeam).toString(), players: [pkey], junk: [],
        });
      } else {
        newGame.holes[holeIndex].teams = [{
          team: '1', players: [pkey], junk: [],
        }];
      }
    }
  });
  //console.log('addPlayerToOwnTeam newGame', newGame);
  const { loading, error, data } = await updateGame({
    variables: {
      gkey: gkey,
      game: newGame,
    },
  });

  if( error ) console.log('Error updating game - addPlayerToOwnTeam', error);

};


export const playerListIndividual = ({game}) => {
  return (
    filter(
      game.players.map(p => {
        if( !p ) return null;
        return ({
          key: p._key,
          pkey: p._key,
          name: p.name,
          team: '0',
        });
      }),
      (p => p != null)
    )
  )
};


export const playerListWithTeams = ({game, scores}) => {
  const ret = [];
  if( !scores || !scores.holes || !scores.holes[0] ) return ret;
  scores.holes[0].teams.map(t => {
    t.players.map(p => {
      const gP = find(game.players, {_key: p.pkey});
      ret.push({
        key: p.pkey,
        pkey: p.pkey,
        name: (gP && gP.name) ? gP.name : '',
        team: t.team,
      });
    });
  });
  return filter(ret, (p => p != null));
};


export const getCoursesPlayersTxt = game => {
  let courses = [], acronyms = [], players = [];
  game.rounds.map(r => {
    if( r && r.player && r.player[0] ) {
      players.push(last(r.player[0].name));
    }
    if( r && r.tee && r.tee.course && r.tee.course.name ) {
      const c = r.tee.course.name;
      if( courses.indexOf(c) < 0 ) courses.push(c);
      const a = acronym(c);
      if( acronyms.indexOf(a) < 0 ) acronyms.push(a);
    }
  });

  const courseFull = (courses.length == 1)
    ? courses[0]
    : acronyms.join(', ');

  const coursesTxt = (acronyms.length > 2)
    ? 'various courses'
    : acronyms.join(', ');

  const playersTxt = (players.length > 5)
    ? `${players.length} players`
    : players.join(', ');

  return {
    courseFull,
    coursesTxt,
    playersTxt,
  };

};

export const teamsRotateOptions = [
  {slug: 'never' , caption: 'Never'  },
  {slug: 'every1', caption: 'Every 1'},
  {slug: 'every3', caption: 'Every 3'},
  {slug: 'every6', caption: 'Every 6'},
];

export const teamsRotate = (game) => (
  game &&
  game.scope &&
  game.scope.teams_rotate &&
  game.scope.teams_rotate !== 'never'
);

export const getLocalHoleInfo = ({game, currentHole}) => {
  // we should have already checked gamespec.location_type == 'local' but...
  let par, length, handicap;
  let sameCourse = true;
  game.rounds.map(r => {
    // check to see if tee is set yet
    if( !r.tee ) return {hole: currentHole};

    const teeHole = find(r.tee.holes, {hole: currentHole});
    if( !teeHole ) {
      sameCourse = false;
      return;
    }
    if( par && par != teeHole.par ) {
      sameCourse = false;
    } else {
      par = teeHole.par;
    }
    if( length && length != teeHole.length ) {
      sameCourse = false;
    } else {
      length = teeHole.length;
    }
    if( handicap && handicap != teeHole.handicap ) {
      sameCourse = false;
    } else {
      handicap = teeHole.handicap;
    }
  });
  if( sameCourse ) {
    return {hole: currentHole, par, length, handicap};
  }
  return {hole: currentHole};
};

export const isTeeSameForAllPlayers = ({game}) => {
  const distinct_tees = groupBy(game.rounds, r => {
    if( r && r.tee && r.tee._key )
      return r.tee._key;
    return null;
  });
  //console.log('distinct_tees',distinct_tees);
  return Object.keys(distinct_tees).length == 1;
};

/*
 *  return the index in the game.scope.wolf_index array for who is wolf
 *  return -1 if data is whack, or we're done with full rounds of wolf rotation
 */
export const getWolfPlayerIndex = ({game, currentHole}) => {
  if( !(game && game.players && game.players.length) ) return -1;
  if( !(game && game.scope && game.scope.wolf_order && game.scope.wolf_order.length) ) return -1;
  if( game.players.length != game.scope.wolf_order.length ) return -1;

  const currHole = parseInt(currentHole);
  const hole_count = getHoles(game).length;
  const player_count = game.scope.wolf_order.length;
  const wolf_round = Math.floor((currHole-1) / player_count);

  // are we past full rounds?
  if( (wolf_round+1) * player_count > hole_count ) return -1;

  const remainder = (currHole-1) % player_count;
  // console.log('getWolfPlayerIndex', currentHole, wolf_round, remainder);
  return remainder;
};
