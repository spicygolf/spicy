import { getRatings } from 'common/utils/game';

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

const get_par = (min, max) => {
  // TODO: implement me
  return;
};
