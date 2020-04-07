import { find } from 'lodash';


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
            };
          }) : [],
          multipliers: h.multipliers ? h.multipliers.map(m => {
            return {
              name: m.name,
              team: m.team,
              first_hole: m.first_hole,
            }
          }) : [],
        };
      }) : [],
    },
    options: game.options || [],
  };
  return ret;

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
