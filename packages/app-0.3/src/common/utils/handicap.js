import { getRatings } from 'common/utils/game';
import { orderBy } from 'lodash-es';

// TODO: deprecate in favor of GHIN API's player_handicap endpoint
export const course_handicap = (strIndex, tee, holes) => {
  if (!tee || !holes) {
    //console.log('course_handicap, no tee or no holes', tee, holes);
    return null;
  }

  // process strIndex => index
  let index = parseFloat(strIndex);
  if (Number.isNaN(index)) {
    return null;
  }
  if (strIndex.toString().charAt(0) === '+') {
    index *= -1;
  }

  let par;
  switch (holes) {
    case 'front9':
      par = get_par(tee, 1, 9);
      break;
    case 'back9':
      par = get_par(tee, 10, 18);
      break;
    case 'all18':
      par = get_par(tee, 1, 18);
      break;
    default:
      console.log(`course_handicap - invalid value for holes: '${holes}'`);
      break;
  }
  if (par === null) {
    return null;
  }
  const { rating, slope } = getRatings(holes, tee);
  //console.log(index, slope, rating, par);
  return Math.round(index * (slope / 113) + (rating - par));
};

export const formatCourseHandicap = (CH) => {
  if (!CH) {
    return '';
  }
  CH = CH.toString().replace('-', '+');
  if (CH === '-') {
    return '';
  }
  return CH.toString();
};

const get_par = (tee, min, max) => {
  let par = 0;
  const holes = orderBy(tee.holes, ['number'], ['asc']);
  for (let i = min; i <= max; i++) {
    par += holes[i - 1].par;
  }
  return par;
};
