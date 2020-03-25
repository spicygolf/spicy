
import { getRatings } from 'common/utils/game';



export const course_handicap = (index, tee, holes) => {

  if( !tee || !holes ) {
    //console.log('course_handicap, no tee or no holes', tee, holes);
    return null;
  }

  let par;
  switch (holes) {
    case 'front9':
      par = get_par(tee, 1, 9);
      par = 36;
      break;
    case 'back9':
      par = get_par(tee, 10, 18);
      par = 36;
      break;
    case 'all18':
      par = get_par(tee, 1, 18);
      par = 72;
      break;
    default:
      console.log(`course_handicap - invalid value for holes: '${holes}'`);
      return null;
      break;
  }

  const { rating, slope } = getRatings(holes, tee);
  //console.log(index, slope, rating, par);
  return Math.round((index * (slope / 113)) + (rating - par));

};

const get_par = (min, max) => {
  // TODO: implement me
  return;
}