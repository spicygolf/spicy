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
