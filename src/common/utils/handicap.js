



export const course_handicap = (index, tee, holes) => {

  if( !tee || !holes ) {
    //console.log('course_handicap, no tee or no holes', tee, holes);
    return null;
  }

  let par, rating, slope;
  switch (holes) {
    case 'front9':
      par = get_par(tee, 1, 9);
      par = 36;
      rating = tee.rating.front9;
      slope = tee.slope.front9;
      break;
    case 'back9':
      par = get_par(tee, 10, 18);
      par = 36;
      rating = tee.rating.back9;
      slope = tee.slope.back9;
      break;
    case 'all18':
      par = get_par(tee, 1, 18);
      par = 72;
      rating = tee.rating.all18;
      slope = tee.slope.all18;
      break;
    default:
      console.log(`course_handicap - invalid value for holes: '${holes}'`);
      return null;
      break;
  }

  //console.log(index, slope, rating, par);
  return Math.round((index * (slope / 113)) + (rating - par));

};

const get_par = (min, max) => {
  // TODO: implement me
  return;
}