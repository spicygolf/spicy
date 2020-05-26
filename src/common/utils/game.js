import { cloneDeep, filter, find, findIndex, reduce } from 'lodash';

import {
  ACTIVE_GAMES_FOR_PLAYER_QUERY,
} from 'features/games/graphql';
import {
  GAME_HOLES_FRAGMENT
} from 'features/game/graphql';
import { getHolesToUpdate } from 'common/utils/teams';
import { acronym, last } from 'common/utils/text';



export const getHoles = game => {
  return game.holes.map(h => h.hole.toString());
};


export const getIsScoringComplete = ({game, scores}) => {
  let ret = true;
  const playerCount = game.players.length;
  scores.holes.map(h => {
    if( h.scoresEntered < playerCount ) ret = false;
    if( h.markedJunk < h.requiredJunk ) ret = false;
  });
  return ret;
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
        type: o.type,
        disp: o.disp,
        value: o.value,
      };
    }) : [],
  };
  return cloneDeep(ret);

};

export const stripKey = (data, toStrip) => {
  let result = {};
  for( const key in data ) {
    if( data.hasOwnProperty(key) ) {
      let value = data[key];
      if( Array.isArray(value) ) {
        result[key] = value.map(v => stripKey(v, toStrip));
      } else if( typeof value === 'object' ) {
        value = stripKey(value, toStrip);
        if( key !== toStrip ) {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    }
  }
  return cloneDeep(result);
};


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


export const getAllOptions = game => {
  let options = [];
  const gsOptions = getAllGamespecOptions(game);
  if( gsOptions && gsOptions.length ) gsOptions.map(gso => {
    let o = {
      name: gso.name,
      type: gso.type,
      disp: gso.disp,
      choices: gso.choices,
      value: gso.default,
      gamespec_key: gso.gamespec_key,
    };
    // if found, a game option overrides a gamespec option
    const go = find(game.options, {name: gso.name});
    if( go ) o.value = go.value;
    options.push(o);
  });
  return options;
};


export const getOption = (game, option) => {

  let v = null;
  const options = getAllOptions(game);

  const go = find(options, {name: option});
  if( go && go.value ) v = go.value;
  //console.log('2', gso, go, v);

  // convert bool
  if( (go && go.type == 'bool') ) {
    v = (v === true || v === 'true');
  }
  //console.log('3', gso, go, v);

  return {
    name: option,
    value: v,
  };
}


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
  if( !j || !j.value ) return null;
  return j.value;
};


export const setTeamJunk = (t, junk, newValue, pkey) => {

  if( findIndex(t.players, p => (p == pkey)) >= 0 ) {
    // this is the player's team for junk being set
    let newJunk = [];
    //console.log('team junk', t.junk);
    if( newValue ) {
      newJunk.push({
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

export const updateGameHolesCache = ({cache, gkey, holes}) => {

  // read holes from cache
  const optimistic = true;
  const cGame = cache.readFragment({
    id: gkey,
    fragment: GAME_HOLES_FRAGMENT,
  }, optimistic);
  //console.log('getGame from cache', cGame);

  // write back to cache with new values
  cache.writeFragment({
    id: gkey,
    fragment: GAME_HOLES_FRAGMENT,
    data: {
      holes,
    },
  });

};

export const addPlayerToOwnTeam = async ({pkey, game, updateGame}) => {

  const { _key: gkey } = game;
  let newGame = getNewGameForUpdate(game);

  const holesToUpdate = getHolesToUpdate(newGame.scope.teams_rotate, game);
  if( !newGame.holes ) {
    newGame.holes = [];
  }
  console.log('holesToUpdate', holesToUpdate);
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
  console.log('addPlayerToOwnTeam newGame', newGame);
  const { loading, error, data } = await updateGame({
    variables: {
      gkey: gkey,
      game: newGame,
    },
    update: (cache, { data }) => {
      //console.log('cache data', cache.data);
      updateGameHolesCache({
        cache,
        gkey,
        holes: newGame.holes,
      });
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
        name: gP.name || '',
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
