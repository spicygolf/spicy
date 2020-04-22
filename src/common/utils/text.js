
export const acronym = orig => {
  if( orig.length < 10 ) return orig;
  let matches = orig.match(/\b(\w)/g);
  let acronym = matches.join('');
  return acronym;
};
