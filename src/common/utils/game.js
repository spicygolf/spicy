

export const getHoles = game => {

  //console.log('game utils game', game);

  let holes = Array.from(Array(18).keys()).map(x => ++x);
  if( game.holes == 'front9' ) holes.length = 9;
  if( game.holes == 'back9' ) holes.splice(0, 9);

  return holes.map(h => h.toString());

};
