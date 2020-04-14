import { cloneDeep, find, findIndex } from 'lodash';
import { ACTIVE_GAMES_FOR_PLAYER_QUERY } from 'features/games/graphql';

export const getHoles = game => {

  //console.log('game utils game', game);

  let holes = Array.from(Array(18).keys()).map(x => ++x);
  if( game.holes == 'front9' ) holes.length = 9;
  if( game.holes == 'back9' ) holes.splice(0, 9);

  return holes.map(h => h.toString());

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
    holes: game.holes,
    teams: {
      rotate: game.teams.rotate,
      holes: game.teams.holes ? game.teams.holes.map(h => {
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
    },
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

export const getJunk = (junkName, pkey, game, holeNum) => {
  if( !game || !game.teams || !game.teams.holes ) return null;
  const gHole = find(game.teams.holes, {hole: holeNum});
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
      fetchPolicy: 'cache-and-network',
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
